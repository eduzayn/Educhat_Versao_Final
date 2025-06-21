import { BaseStorage } from '../base/BaseStorage';
import { messages, conversations, type Message, type InsertMessage } from '@shared/schema';
import { eq, desc, asc, and, isNull } from 'drizzle-orm';

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
    return this.basicOps.getMessagesByConversation(conversationId);
  }

  async getUnreadMessages(conversationId: number): Promise<Message[]> {
    return this.basicOps.getUnreadMessages(conversationId);
  }

  // Status operations
  async markMessageAsRead(id: number): Promise<void> {
    return this.statusOps.markMessageAsRead(id);
  }

  async markMessageAsUnread(id: number): Promise<void> {
    return this.statusOps.markMessageAsUnread(id);
  }

  async markMessageAsDelivered(id: number): Promise<void> {
    return this.statusOps.markMessageAsDelivered(id);
  }

  async markMessageAsDeleted(id: number): Promise<void> {
    return this.statusOps.markMessageAsDeleted(id);
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