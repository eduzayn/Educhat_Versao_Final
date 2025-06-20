import { BaseStorage } from '../base/BaseStorage';
import { messages, conversations, type Message, type InsertMessage } from '@shared/schema';
import { eq, desc, asc, and, isNull } from 'drizzle-orm';

export class MessageBasicOperations extends BaseStorage {
  async getAllMessages(): Promise<Message[]> {
    return this.db.select().from(messages).orderBy(asc(messages.sentAt), asc(messages.id));
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await this.db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessages(conversationId: number, limit = 50, offset = 0): Promise<Message[]> {
    // Para carregar mensagens com scroll para baixo, precisamos:
    // 1. Buscar as mensagens mais recentes primeiro (se offset = 0)
    // 2. Buscar mensagens mais antigas quando offset > 0 (para carregar histórico)
    
    // Primeiro, contar total de mensagens para calcular offset correto
    const totalCount = await this.db.select({
      count: messages.id
    }).from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isDeleted, false)
      ));

    const total = totalCount.length;
    
    // Se offset = 0, queremos as mensagens mais recentes
    // Se offset > 0, queremos mensagens mais antigas (paginação reversa)
    const adjustedOffset = offset === 0 
      ? Math.max(0, total - limit) // Pegar as últimas 'limit' mensagens
      : Math.max(0, total - offset - limit); // Pegar mensagens anteriores

    const results = await this.db.select({
      id: messages.id,
      conversationId: messages.conversationId,
      content: messages.content,
      isFromContact: messages.isFromContact,
      messageType: messages.messageType,
      sentAt: messages.sentAt,
      deliveredAt: messages.deliveredAt,
      readAt: messages.readAt,
      whatsappMessageId: messages.whatsappMessageId,
      zapiStatus: messages.zapiStatus,
      isGroup: messages.isGroup,
      referenceMessageId: messages.referenceMessageId,
      isInternalNote: messages.isInternalNote,
      authorId: messages.authorId,
      authorName: messages.authorName,
      isHiddenForUser: messages.isHiddenForUser,
      isDeletedByUser: messages.isDeletedByUser,
      deletedAt: messages.deletedAt,
      deletedBy: messages.deletedBy,
      isDeleted: messages.isDeleted,
      metadata: messages.metadata
    }).from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isDeleted, false)
      ))
      .orderBy(asc(messages.sentAt), asc(messages.id))
      .limit(limit)
      .offset(adjustedOffset);

    return results as Message[];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await this.db.insert(messages).values(message).returning();
    
    // Calcular novo unread_count se a mensagem é do contato
    let unreadCountUpdate = {};
    if (newMessage.isFromContact) {
      const unreadCount = await this.db.select()
        .from(messages)
        .where(and(
          eq(messages.conversationId, newMessage.conversationId),
          eq(messages.isFromContact, true),
          isNull(messages.readAt),
          eq(messages.isDeleted, false)
        ));
      
      unreadCountUpdate = { unreadCount: unreadCount.length };
    }
    
    // Atualizar a conversa com last_message_at e unread_count
    await this.db.update(conversations)
      .set({ 
        lastMessageAt: newMessage.sentAt,
        updatedAt: new Date(),
        ...unreadCountUpdate
      })
      .where(eq(conversations.id, newMessage.conversationId));
    
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
    await this.db.delete(messages).where(eq(messages.id, id));
  }

  async getUnreadMessages(conversationId: number): Promise<Message[]> {
    return this.db.select().from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isFromContact, true),
        isNull(messages.readAt),
        eq(messages.isDeleted, false)
      ))
      .orderBy(asc(messages.sentAt), asc(messages.id));
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return this.db.select().from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isDeleted, false)
      ))
      .orderBy(asc(messages.sentAt), asc(messages.id));
  }
} 