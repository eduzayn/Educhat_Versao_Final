import { BaseStorage } from "../base/BaseStorage";
import { quickReplies, quickReplyTeamShares, quickReplyShares, type QuickReply, type InsertQuickReply } from "@shared/schema";
import { eq, desc, and, or, inArray, ilike } from "drizzle-orm";

/**
 * Quick Reply storage module - manages quick replies and sharing
 */
export class QuickReplyStorage extends BaseStorage {
  async getQuickReplies(): Promise<QuickReply[]> {
    return this.db.select().from(quickReplies).orderBy(desc(quickReplies.createdAt));
  }

  async getQuickReply(id: number): Promise<QuickReply | undefined> {
    const [quickReply] = await this.db.select().from(quickReplies).where(eq(quickReplies.id, id));
    return quickReply;
  }

  async createQuickReply(quickReplyData: InsertQuickReply): Promise<QuickReply> {
    const [newQuickReply] = await this.db.insert(quickReplies).values(quickReplyData).returning();
    return newQuickReply;
  }

  async updateQuickReply(id: number, quickReplyData: Partial<InsertQuickReply>): Promise<QuickReply> {
    const [updated] = await this.db.update(quickReplies)
      .set({ ...quickReplyData, updatedAt: new Date() })
      .where(eq(quickReplies.id, id))
      .returning();
    return updated;
  }

  async deleteQuickReply(id: number): Promise<void> {
    // Delete shares first
    await this.deleteQuickReplyTeamShares(id);
    await this.deleteQuickReplyUserShares(id);
    
    // Delete the quick reply
    await this.db.delete(quickReplies).where(eq(quickReplies.id, id));
  }

  async incrementQuickReplyUsage(id: number): Promise<void> {
    // Get current usage count
    const [current] = await this.db.select({ usageCount: quickReplies.usageCount })
      .from(quickReplies)
      .where(eq(quickReplies.id, id));
    
    await this.db.update(quickReplies)
      .set({ 
        usageCount: (current?.usageCount || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(quickReplies.id, id));
  }

  async createQuickReplyTeamShare(share: any): Promise<any> {
    const [newShare] = await this.db.insert(quickReplyTeamShares).values(share).returning();
    return newShare;
  }

  async createQuickReplyUserShare(share: any): Promise<any> {
    const [newShare] = await this.db.insert(quickReplyShares).values(share).returning();
    return newShare;
  }

  async deleteQuickReplyTeamShares(quickReplyId: number): Promise<void> {
    await this.db.delete(quickReplyTeamShares).where(eq(quickReplyTeamShares.quickReplyId, quickReplyId));
  }

  async deleteQuickReplyUserShares(quickReplyId: number): Promise<void> {
    await this.db.delete(quickReplyShares).where(eq(quickReplyShares.quickReplyId, quickReplyId));
  }

  async getUserQuickReplies(userId: number): Promise<QuickReply[]> {
    // Buscar respostas rápidas do usuário (próprias + compartilhadas)
    return this.db.select().from(quickReplies)
      .where(
        or(
          eq(quickReplies.createdBy, userId),
          eq(quickReplies.shareScope, 'global')
        )
      )
      .orderBy(desc(quickReplies.usageCount), desc(quickReplies.createdAt));
  }
}