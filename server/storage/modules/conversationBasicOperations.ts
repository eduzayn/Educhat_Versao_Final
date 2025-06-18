import { BaseStorage } from "../base/BaseStorage";
import { conversations, type Conversation, type InsertConversation } from "@shared/schema";
import { eq } from "drizzle-orm";

export class ConversationBasicOperations extends BaseStorage {
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [created] = await this.db
      .insert(conversations)
      .values(conversation)
      .returning();
    return created;
  }

  async updateConversation(id: number, conversationData: Partial<InsertConversation>): Promise<Conversation> {
    const [updated] = await this.db
      .update(conversations)
      .set({
        ...conversationData,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async deleteConversation(id: number): Promise<void> {
    await this.db
      .delete(conversations)
      .where(eq(conversations.id, id));
  }

  async getConversationByContactId(contactId: number): Promise<Conversation | null> {
    const [conversation] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.contactId, contactId))
      .limit(1);
    
    return conversation || null;
  }

  async updateConversationStatus(conversationId: number, status: string): Promise<void> {
    await this.db
      .update(conversations)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  async updateLastMessage(conversationId: number, messageId: number): Promise<void> {
    await this.db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }
} 