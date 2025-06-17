import { BaseStorage } from "../base/BaseStorage";
import { conversations } from "@shared/schema";
import { eq } from "drizzle-orm";

export class ConversationTagOperations extends BaseStorage {
  async addConversationTag(conversationId: number, tag: string): Promise<void> {
    const [conversation] = await this.db
      .select({ tags: conversations.tags })
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (conversation) {
      const currentTags = conversation.tags || [];
      if (!currentTags.includes(tag)) {
        await this.db
          .update(conversations)
          .set({
            tags: [...currentTags, tag],
            updatedAt: new Date()
          })
          .where(eq(conversations.id, conversationId));
      }
    }
  }

  async removeConversationTag(conversationId: number, tag: string): Promise<void> {
    const [conversation] = await this.db
      .select({ tags: conversations.tags })
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (conversation) {
      const currentTags = conversation.tags || [];
      const updatedTags = currentTags.filter(t => t !== tag);
      
      await this.db
        .update(conversations)
        .set({
          tags: updatedTags,
          updatedAt: new Date()
        })
        .where(eq(conversations.id, conversationId));
    }
  }
} 