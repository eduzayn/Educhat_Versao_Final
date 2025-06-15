import { BaseStorage } from "../base/BaseStorage";
import { messages, conversations, users, systemUsers, type Message, type InsertMessage } from "../../../shared/schema";
import { eq, desc, and, isNull, lt } from "drizzle-orm";

/**
 * Message storage module - manages messages and media handling
 */
export class MessageStorage extends BaseStorage {
  async getAllMessages(): Promise<Message[]> {
    return this.db.select().from(messages).orderBy(desc(messages.sentAt));
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await this.db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessages(conversationId: number, limit = 50, offset = 0): Promise<Message[]> {
    return this.db.select().from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.sentAt)) // Ordem decrescente para scroll infinito
      .limit(limit)
      .offset(offset);
  }

  async getMessagesWithDeletedByInfo(conversationId: number, limit = 50, offset = 0, cursor?: string): Promise<any[]> {
    // ✅ OTIMIZAÇÃO: Buscar todas as mensagens com JOIN único para eliminar N+1 queries
    const query = this.db
      .select({
        // Campos da mensagem
        id: messages.id,
        conversationId: messages.conversationId,
        content: messages.content,
        isFromContact: messages.isFromContact,
        messageType: messages.messageType,
        metadata: messages.metadata,
        isDeleted: messages.isDeleted,
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
        // Campos do usuário que deletou (LEFT JOIN para não perder mensagens)
        deletedByUserId: systemUsers.id,
        deletedByUserDisplayName: systemUsers.displayName,
        deletedByUserUsername: systemUsers.username
      })
      .from(messages)
      .leftJoin(systemUsers, eq(messages.deletedBy, systemUsers.id))
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isDeleted, false),
        cursor ? lt(messages.id, parseInt(cursor)) : undefined
      ))
      .orderBy(desc(messages.sentAt))
      .limit(limit);

    if (!cursor && offset > 0) {
      query.offset(offset);
    }

    const results = await query;
    
    // Mapear resultados para formato esperado
    return results.map(row => ({
      id: row.id,
      conversationId: row.conversationId,
      content: row.content,
      isFromContact: row.isFromContact,
      messageType: row.messageType,
      metadata: row.metadata,
      isDeleted: row.isDeleted,
      sentAt: row.sentAt,
      deliveredAt: row.deliveredAt,
      readAt: row.readAt,
      whatsappMessageId: row.whatsappMessageId,
      zapiStatus: row.zapiStatus,
      isGroup: row.isGroup,
      referenceMessageId: row.referenceMessageId,
      isInternalNote: row.isInternalNote,
      authorId: row.authorId,
      authorName: row.authorName,
      isHiddenForUser: row.isHiddenForUser,
      isDeletedByUser: row.isDeletedByUser,
      deletedAt: row.deletedAt,
      deletedBy: row.deletedBy,
      deletedByUser: row.deletedByUserId ? {
        id: row.deletedByUserId,
        displayName: row.deletedByUserDisplayName,
        username: row.deletedByUserUsername
      } : null
    }));
  }

  async getMessageMedia(messageId: number): Promise<string | null> {
    const [message] = await this.db.select({ 
      metadata: messages.metadata 
    }).from(messages).where(eq(messages.id, messageId));
    
    if (!message?.metadata || typeof message.metadata !== 'object') {
      return null;
    }
    
    const metadata = message.metadata as any;
    return metadata.fileUrl || metadata.mediaUrl || null;
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



  async markMessageAsRead(id: number): Promise<void> {
    await this.db.update(messages)
      .set({ 
        readAt: new Date()
      })
      .where(eq(messages.id, id));
  }

  async markMessageAsUnread(id: number): Promise<void> {
    await this.db.update(messages)
      .set({ 
        readAt: null
      })
      .where(eq(messages.id, id));
  }

  async markMessageAsDelivered(id: number): Promise<void> {
    await this.db.update(messages)
      .set({ 
        deliveredAt: new Date()
      })
      .where(eq(messages.id, id));
  }

  async markMessageAsDeleted(id: number): Promise<void> {
    await this.db.update(messages)
      .set({ 
        isDeleted: true
      })
      .where(eq(messages.id, id));
  }

  async markMessageAsDeletedByUser(messageId: number, deletedByUser: boolean, userId?: number): Promise<boolean> {
    try {
      console.log('🔍 DEBUG markMessageAsDeletedByUser:', {
        messageId,
        deletedByUser,
        userId,
        userIdType: typeof userId,
        actualUserId: userId || 35
      });

      const result = await this.db.update(messages)
        .set({ 
          isDeletedByUser: deletedByUser,
          deletedAt: deletedByUser ? new Date() : null,
          deletedBy: deletedByUser ? (userId || 35) : null
        })
        .where(eq(messages.id, messageId))
        .returning();
      
      console.log('✅ UPDATE result:', result[0]);
      return result.length > 0;
    } catch (error) {
      console.error('Erro ao marcar mensagem como deletada pelo usuário:', error);
      return false;
    }
  }

  async getMessageByZApiId(zapiMessageId: string): Promise<Message | undefined> {
    const [message] = await this.db.select().from(messages)
      .where(eq(messages.whatsappMessageId, zapiMessageId));
    return message;
  }

  async getMessagesByMetadata(key: string, value: string): Promise<Message[]> {
    // Esta implementação é simplificada - pode ser melhorada com queries JSON mais específicas
    const allMessages = await this.db.select().from(messages)
      .where(isNull(messages.isDeleted));
    
    return allMessages.filter(message => {
      if (!message.metadata || typeof message.metadata !== 'object') {
        return false;
      }
      const metadata = message.metadata as any;
      return metadata[key] === value;
    });
  }

  async updateMessageZApiStatus(whatsappMessageId: string, status: string): Promise<void> {
    await this.db.update(messages)
      .set({ 
        zapiStatus: status
      })
      .where(eq(messages.whatsappMessageId, whatsappMessageId));
  }

  async getUnreadMessages(conversationId: number): Promise<Message[]> {
    return this.db.select().from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isFromContact, true),
        isNull(messages.readAt),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.sentAt));
  }

  async markConversationMessagesAsRead(conversationId: number): Promise<void> {
    await this.db.update(messages)
      .set({ 
        readAt: new Date()
      })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isFromContact, true),
        isNull(messages.readAt)
      ));
    
    // Atualizar unread_count da conversa para 0
    await this.db.update(conversations)
      .set({ 
        unreadCount: 0,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async getInternalNotes(conversationId: number): Promise<Message[]> {
    return this.db.select().from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.isInternalNote, true),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.sentAt));
  }

  async createInternalNote(conversationId: number, content: string, authorId: number, authorName: string): Promise<Message> {
    const noteData: InsertMessage = {
      conversationId,
      content,
      isFromContact: false,
      isInternalNote: true,
      authorId,
      authorName,
      messageType: 'text',
      sentAt: new Date()
    };

    return this.createMessage(noteData);
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return this.getMessages(conversationId);
  }

  async updateMessage(id: number, messageData: Partial<InsertMessage>): Promise<Message> {
    const [updated] = await this.db.update(messages)
      .set({ ...messageData, updatedAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return updated;
  }

  async deleteMessage(id: number): Promise<void> {
    await this.db.delete(messages).where(eq(messages.id, id));
  }


}