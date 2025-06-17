import { BaseStorage } from '../base/BaseStorage';
import { manychatWebhookLogs, type ManychatWebhookLog, type InsertManychatWebhookLog } from '../../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';

export class ManychatWebhookLogOperations extends BaseStorage {
  async createWebhookLog(log: InsertManychatWebhookLog): Promise<ManychatWebhookLog> {
    const results = await this.db
      .insert(manychatWebhookLogs)
      .values(log)
      .returning();
    
    return results[0];
  }

  async getWebhookLogs(integrationId?: number, limit: number = 50): Promise<ManychatWebhookLog[]> {
    if (integrationId) {
      return this.db
        .select()
        .from(manychatWebhookLogs)
        .where(eq(manychatWebhookLogs.integrationId, integrationId))
        .orderBy(desc(manychatWebhookLogs.createdAt))
        .limit(limit);
    }
    
    return this.db
      .select()
      .from(manychatWebhookLogs)
      .orderBy(desc(manychatWebhookLogs.createdAt))
      .limit(limit);
  }

  async markWebhookProcessed(id: number, processed: boolean, error?: string): Promise<void> {
    await this.db
      .update(manychatWebhookLogs)
      .set({
        processed,
        processedAt: processed ? new Date() : null,
        error: error || null
      })
      .where(eq(manychatWebhookLogs.id, id));
  }

  async getUnprocessedWebhooks(integrationId?: number): Promise<ManychatWebhookLog[]> {
    if (integrationId) {
      return this.db
        .select()
        .from(manychatWebhookLogs)
        .where(and(
          eq(manychatWebhookLogs.processed, false),
          eq(manychatWebhookLogs.integrationId, integrationId)
        ))
        .orderBy(manychatWebhookLogs.createdAt);
    }
    
    return this.db
      .select()
      .from(manychatWebhookLogs)
      .where(eq(manychatWebhookLogs.processed, false))
      .orderBy(manychatWebhookLogs.createdAt);
  }

  /**
   * Log webhook data for debugging and monitoring
   */
  async logWebhook(webhookData: Partial<InsertManychatWebhookLog>): Promise<ManychatWebhookLog> {
    const logData = {
      integrationId: webhookData.integrationId || null,
      webhookType: webhookData.webhookType || 'message',
      payload: webhookData.payload || {},
      processed: webhookData.processed || false,
      contactId: webhookData.contactId || null,
      conversationId: webhookData.conversationId || null
    };

    const result = await this.db
      .insert(manychatWebhookLogs)
      .values(logData)
      .returning();
    
    return result[0];
  }

  async updateWebhookLogStatus(webhookId: number, processed: boolean): Promise<void> {
    await this.db
      .update(manychatWebhookLogs)
      .set({ 
        processed,
        processedAt: processed ? new Date() : null 
      })
      .where(eq(manychatWebhookLogs.id, webhookId));
  }
} 