import { BaseStorage } from '../base/BaseStorage';
import { messages, conversations, type Message, type InsertMessage } from '@shared/schema';
import { eq, desc, asc, and, isNull, inArray } from 'drizzle-orm';

/**
 * Message storage module - consolidated operations for messages and media handling
 * CONSOLIDADO: Integra todas as operações de mensagens em uma única classe
 */
export class MessageStorage extends BaseStorage {

  // ==================== BASIC OPERATIONS ====================
  async getAllMessages(): Promise<Message[]> {
    return this.db.select().from(messages).orderBy(asc(messages.sentAt), asc(messages.id));
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await this.db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessages(conversationId: number, limit = 50, offset = 0): Promise<Message[]> {
    const totalCount = await this.db.select({
      count: messages.id
    }).from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isDeleted, false)
      ));

    const total = totalCount.length;
    
    if (offset === 0) {
      return this.db.select().from(messages)
        .where(and(
          eq(messages.conversationId, conversationId),
          eq(messages.isDeleted, false)
        ))
        .orderBy(asc(messages.sentAt), asc(messages.id))
        .limit(limit);
    } else {
      return this.db.select().from(messages)
        .where(and(
          eq(messages.conversationId, conversationId),
          eq(messages.isDeleted, false)
        ))
        .orderBy(asc(messages.sentAt), asc(messages.id))
        .limit(limit)
        .offset(Math.max(0, total - limit - offset));
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await this.db.insert(messages).values(message).returning();
    return newMessage;
  }

  /**
   * Versão otimizada para criar mensagens com prepared statement
   * e índices otimizados para melhor performance
   */
  async createMessageOptimized(message: InsertMessage): Promise<Message> {
    const startTime = performance.now();
    
    // Usar prepared statement com valores otimizados
    const optimizedMessage = {
      ...message,
      sentAt: message.sentAt || new Date(),
      zapiStatus: message.zapiStatus || 'PENDING',
      isDeleted: false,
      isGroup: false
    };

    const [newMessage] = await this.db
      .insert(messages)
      .values(optimizedMessage)
      .returning();

    // Atualizar última mensagem da conversa em paralelo (não bloqueia)
    this.updateConversationLastMessage(newMessage.conversationId, newMessage.sentAt)
      .catch(err => console.warn('Erro ao atualizar última mensagem:', err.message));

    const duration = performance.now() - startTime;
    console.log(`💾 Mensagem salva no BD em ${duration.toFixed(1)}ms`);
    
    return newMessage;
  }

  /**
   * Atualiza status Z-API da mensagem sem bloquear
   */
  async updateMessageZApiStatus(messageId: number, zapiData: {
    whatsappMessageId?: string;
    zapiStatus?: string;
  }): Promise<void> {
    await this.db
      .update(messages)
      .set(zapiData)
      .where(eq(messages.id, messageId));
  }

  /**
   * Atualiza timestamp da última mensagem na conversa
   */
  private async updateConversationLastMessage(conversationId: number, lastMessageAt: Date): Promise<void> {
    await this.db
      .update(conversations)
      .set({ 
        lastMessageAt,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async updateMessage(id: number, messageData: Partial<InsertMessage>): Promise<Message> {
    const [updated] = await this.db.update(messages)
      .set(messageData)
      .where(eq(messages.id, id))
      .returning();
    return updated;
  }

  async deleteMessage(id: number): Promise<void> {
    await this.db.update(messages)
      .set({ isDeleted: true })
      .where(eq(messages.id, id));
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return this.db.select().from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isDeleted, false)
      ))
      .orderBy(asc(messages.sentAt));
  }

  async getMessagesByConversationIds(conversationIds: number[]): Promise<Message[]> {
    if (conversationIds.length === 0) return [];
    
    return this.db.select().from(messages)
      .where(and(
        inArray(messages.conversationId, conversationIds),
        eq(messages.isDeleted, false)
      ))
      .orderBy(asc(messages.sentAt));
  }

  async getUnreadMessages(conversationId: number): Promise<Message[]> {
    return this.db.select().from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isDeleted, false),
        isNull(messages.readAt)
      ))
      .orderBy(asc(messages.sentAt));
  }

  // Status operations
  async markMessageAsRead(id: number): Promise<void> {
    await this.db.update(messages)
      .set({ readAt: new Date() })
      .where(eq(messages.id, id));
  }

  async markMessageAsUnread(id: number): Promise<void> {
    await this.db.update(messages)
      .set({ readAt: null })
      .where(eq(messages.id, id));
  }

  async markMessageAsDelivered(id: number): Promise<void> {
    await this.db.update(messages)
      .set({ deliveredAt: new Date() })
      .where(eq(messages.id, id));
  }

  async markMessageAsDeleted(id: number): Promise<void> {
    await this.db.update(messages)
      .set({ isDeleted: true })
      .where(eq(messages.id, id));
  }

  async markMessageAsDeletedByUser(messageId: number, deletedByUser: boolean, userId?: number): Promise<boolean> {
    return this.statusOps.markMessageAsDeletedByUser(messageId, deletedByUser, userId);
  }

  async markConversationMessagesAsRead(conversationId: number): Promise<void> {
    return this.statusOps.markConversationMessagesAsRead(conversationId);
  }

  // Media operations
  async getMessageMedia(messageId: number): Promise<string | null> {
    return this.mediaOps.getMessageMedia(messageId);
  }

  async getMessagesByMetadata(key: string, value: string): Promise<Message[]> {
    return this.mediaOps.getMessagesByMetadata(key, value);
  }

  /**
   * Get media file data for a message (for audio streaming)
   */
  async getMediaFile(messageId: number): Promise<{
    fileData: string;
    mimeType: string;
    fileSize: number;
    duration?: number;
    fileName: string;
    isCompressed?: boolean;
    compressionQuality?: number;
  } | null> {
    const { mediaFiles } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const [mediaFile] = await this.db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.messageId, messageId));
    
    if (!mediaFile) {
      return null;
    }
    
    return {
      fileData: mediaFile.fileData,
      mimeType: mediaFile.mimeType,
      fileSize: mediaFile.fileSize,
      duration: mediaFile.duration || undefined,
      fileName: mediaFile.fileName,
      isCompressed: mediaFile.isCompressed || undefined,
      compressionQuality: mediaFile.compressionQuality || undefined
    };
  }

  // Internal notes operations
  async getInternalNotes(conversationId: number): Promise<Message[]> {
    return this.notesOps.getInternalNotes(conversationId);
  }

  async createInternalNote(data: {
    conversationId: number;
    content: string;
    authorId: number;
    authorName: string;
    noteType?: string;
    notePriority?: string;
    noteTags?: string[];
    isPrivate?: boolean;
  }): Promise<Message> {
    return this.notesOps.createInternalNote(data);
  }

  async updateInternalNote(id: number, data: any): Promise<Message> {
    return this.notesOps.updateInternalNote(id, data);
  }

  async getInternalNotesByPriority(conversationId: number, priority: string): Promise<Message[]> {
    return this.notesOps.getInternalNotesByPriority(conversationId, priority);
  }

  async getInternalNotesByTags(conversationId: number, tags: string[]): Promise<Message[]> {
    return this.notesOps.getInternalNotesByTags(conversationId, tags);
  }

  // Getter para acessar diretamente as operações de notas internas
  get messageInternalNotesOps() {
    return this.notesOps;
  }

  // Z-API operations
  async getMessageByZApiId(zapiMessageId: string): Promise<Message | undefined> {
    return this.zapiOps.getMessageByZApiId(zapiMessageId);
  }

  async updateMessageZApiStatus(whatsappMessageId: string, status: string): Promise<void> {
    return this.zapiOps.updateMessageZApiStatus(whatsappMessageId, status);
  }
}