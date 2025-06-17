import { BaseStorage } from '../base/BaseStorage';
import { facebookWebhookLogs, FacebookWebhookLog, InsertFacebookWebhookLog } from '../../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export class FacebookWebhookLogOperations extends BaseStorage {
  async createWebhookLog(log: InsertFacebookWebhookLog): Promise<FacebookWebhookLog> {
    const result = await this.db.insert(facebookWebhookLogs).values(log).returning();
    return result[0];
  }

  async getWebhookLogs(integrationId?: number, limit: number = 50): Promise<FacebookWebhookLog[]> {
    if (integrationId) {
      return this.db.select().from(facebookWebhookLogs).where(eq(facebookWebhookLogs.integrationId, integrationId)).orderBy(desc(facebookWebhookLogs.createdAt)).limit(limit);
    }
    return this.db.select().from(facebookWebhookLogs).orderBy(desc(facebookWebhookLogs.createdAt)).limit(limit);
  }

  async markWebhookProcessed(id: number, processed: boolean, error?: string): Promise<void> {
    await this.db.update(facebookWebhookLogs).set({ processed, error }).where(eq(facebookWebhookLogs.id, id));
  }

  async getUnprocessedWebhooks(integrationId?: number): Promise<FacebookWebhookLog[]> {
    let whereCondition = eq(facebookWebhookLogs.processed, false);
    if (integrationId) {
      whereCondition = and(eq(facebookWebhookLogs.processed, false), eq(facebookWebhookLogs.integrationId, integrationId));
    }
    return this.db.select().from(facebookWebhookLogs).where(whereCondition).orderBy(facebookWebhookLogs.createdAt);
  }
} 