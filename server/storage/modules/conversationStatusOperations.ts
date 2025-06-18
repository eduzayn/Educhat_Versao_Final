import { DrizzleD1Database } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { conversations } from '../../../shared/schema';

export class ConversationStatusOperations {
  constructor(private db: any) {}

  async markConversationAsRead(conversationId: number): Promise<void> {
    try {
      await this.db
        .update(conversations)
        .set({ 
          isRead: true,
          unreadCount: 0,
          updatedAt: new Date()
        })
        .where(eq(conversations.id, conversationId));
    } catch (error) {
      console.error('Erro ao marcar conversa como lida:', error);
      throw error;
    }
  }

  async markConversationAsUnread(conversationId: number): Promise<void> {
    try {
      await this.db
        .update(conversations)
        .set({ 
          isRead: false,
          unreadCount: 1,
          updatedAt: new Date()
        })
        .where(eq(conversations.id, conversationId));
    } catch (error) {
      console.error('Erro ao marcar conversa como não lida:', error);
      throw error;
    }
  }

  async updateConversationStatus(conversationId: number, status: string): Promise<void> {
    try {
      await this.db
        .update(conversations)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(conversations.id, conversationId));
    } catch (error) {
      console.error('Erro ao atualizar status da conversa:', error);
      throw error;
    }
  }
}