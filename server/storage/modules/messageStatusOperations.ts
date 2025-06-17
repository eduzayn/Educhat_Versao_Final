import { BaseStorage } from '../base/BaseStorage';
import { messages, conversations, type Message } from '../../../shared/schema';
import { eq, and, isNull } from 'drizzle-orm';

export class MessageStatusOperations extends BaseStorage {
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
} 