import { BaseStorage } from "../base/BaseStorage";
import {
  messages,
  conversations,
  type Message,
  type InsertMessage,
} from "@shared/schema";

/**
 * Message storage module
 */
export class MessageStorage extends BaseStorage {
  async getAllMessages(): Promise<Message[]> {
    try {
      return await this.db
        .select()
        .from(messages)
        .orderBy(this.desc(messages.sentAt));
    } catch (error) {
      this.handleError(error, 'getAllMessages');
    }
  }

  async getMessages(conversationId: number, limit = 30, offset = 0): Promise<Message[]> {
    try {
      return await this.db
        .select()
        .from(messages)
        .where(this.eq(messages.conversationId, conversationId))
        .orderBy(messages.sentAt)
        .limit(limit)
        .offset(offset);
    } catch (error) {
      this.handleError(error, 'getMessages');
    }
  }

  async getMessageMedia(messageId: number): Promise<string | null> {
    try {
      const result = await this.db
        .select({ content: messages.content })
        .from(messages)
        .where(this.eq(messages.id, messageId))
        .limit(1);
      
      return result[0]?.content || null;
    } catch (error) {
      this.handleError(error, 'getMessageMedia');
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      this.validateRequired(message, ['conversationId', 'content'], 'createMessage');
      
      const [newMessage] = await this.db
        .insert(messages)
        .values(message)
        .returning();

      if (message.isFromContact) {
        await this.db
          .update(conversations)
          .set({ 
            lastMessageAt: new Date(),
            unreadCount: this.sql`COALESCE(${conversations.unreadCount}, 0) + 1`,
            updatedAt: new Date() 
          })
          .where(this.eq(conversations.id, message.conversationId));
      } else {
        await this.db
          .update(conversations)
          .set({ 
            lastMessageAt: new Date(),
            updatedAt: new Date() 
          })
          .where(this.eq(conversations.id, message.conversationId));
      }

      return newMessage;
    } catch (error) {
      this.handleError(error, 'createMessage');
    }
  }

  async markMessageAsRead(id: number): Promise<void> {
    try {
      await this.db
        .update(messages)
        .set({ readAt: new Date() })
        .where(this.eq(messages.id, id));
    } catch (error) {
      this.handleError(error, 'markMessageAsRead');
    }
  }

  async markMessageAsUnread(id: number): Promise<void> {
    try {
      await this.db
        .update(messages)
        .set({ readAt: null })
        .where(this.eq(messages.id, id));
    } catch (error) {
      this.handleError(error, 'markMessageAsUnread');
    }
  }

  async markMessageAsDelivered(id: number): Promise<void> {
    try {
      await this.db
        .update(messages)
        .set({ deliveredAt: new Date() })
        .where(this.eq(messages.id, id));
    } catch (error) {
      this.handleError(error, 'markMessageAsDelivered');
    }
  }

  async markMessageAsDeleted(id: number): Promise<void> {
    try {
      await this.db
        .update(messages)
        .set({ isDeleted: true })
        .where(this.eq(messages.id, id));
    } catch (error) {
      this.handleError(error, 'markMessageAsDeleted');
    }
  }

  async getMessageByZApiId(zapiMessageId: string): Promise<Message | undefined> {
    try {
      const [message] = await this.db
        .select()
        .from(messages)
        .where(this.eq(messages.whatsappMessageId, zapiMessageId));
      return message;
    } catch (error) {
      this.handleError(error, 'getMessageByZApiId');
    }
  }

  async getMessagesByMetadata(key: string, value: string): Promise<Message[]> {
    try {
      return await this.db
        .select()
        .from(messages)
        .where(this.sql`${messages.metadata}->>'${this.sql.raw(key)}' = ${value}`);
    } catch (error) {
      this.handleError(error, 'getMessagesByMetadata');
    }
  }
}