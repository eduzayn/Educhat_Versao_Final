import { BaseStorage } from '../base/BaseStorage';
import { manychatIntegrations, type ManychatIntegration, type InsertManychatIntegration } from '../../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';

export class ManychatIntegrationOperations extends BaseStorage {
  async getIntegrations(): Promise<ManychatIntegration[]> {
    return this.db.select().from(manychatIntegrations).orderBy(desc(manychatIntegrations.createdAt));
  }

  async getIntegration(id: number): Promise<ManychatIntegration | undefined> {
    const results = await this.db
      .select()
      .from(manychatIntegrations)
      .where(eq(manychatIntegrations.id, id))
      .limit(1);
    
    return results[0];
  }

  async getActiveIntegration(): Promise<ManychatIntegration | undefined> {
    const results = await this.db
      .select()
      .from(manychatIntegrations)
      .where(eq(manychatIntegrations.isActive, true))
      .limit(1);
    
    return results[0];
  }

  async createIntegration(integration: InsertManychatIntegration): Promise<ManychatIntegration> {
    // Deactivate other integrations if this one is being set as active
    if (integration.isActive) {
      await this.db
        .update(manychatIntegrations)
        .set({ isActive: false })
        .where(eq(manychatIntegrations.isActive, true));
    }

    const results = await this.db
      .insert(manychatIntegrations)
      .values({
        ...integration,
        updatedAt: new Date()
      })
      .returning();
    
    return results[0];
  }

  async updateIntegration(id: number, updates: Partial<InsertManychatIntegration>): Promise<ManychatIntegration> {
    // Deactivate other integrations if this one is being set as active
    if (updates.isActive) {
      await this.db
        .update(manychatIntegrations)
        .set({ isActive: false })
        .where(and(
          eq(manychatIntegrations.isActive, true),
          eq(manychatIntegrations.id, id)
        ));
    }

    const results = await this.db
      .update(manychatIntegrations)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(manychatIntegrations.id, id))
      .returning();
    
    return results[0];
  }

  async deleteIntegration(id: number): Promise<void> {
    await this.db
      .delete(manychatIntegrations)
      .where(eq(manychatIntegrations.id, id));
  }

  async updateIntegrationStatus(id: number, isActive: boolean): Promise<void> {
    if (isActive) {
      // Deactivate other integrations
      await this.db
        .update(manychatIntegrations)
        .set({ isActive: false })
        .where(eq(manychatIntegrations.isActive, true));
    }

    await this.db
      .update(manychatIntegrations)
      .set({ 
        isActive,
        updatedAt: new Date()
      })
      .where(eq(manychatIntegrations.id, id));
  }

  async updateLastTest(id: number, success: boolean, error?: string): Promise<void> {
    await this.db
      .update(manychatIntegrations)
      .set({
        lastTestAt: new Date(),
        errorCount: success ? 0 : undefined,
        lastError: error || null,
        updatedAt: new Date()
      })
      .where(eq(manychatIntegrations.id, id));
  }

  async updateLastSync(id: number, success: boolean, error?: string): Promise<void> {
    await this.db
      .update(manychatIntegrations)
      .set({
        lastSyncAt: new Date(),
        errorCount: success ? 0 : undefined,
        lastError: error || null,
        updatedAt: new Date()
      })
      .where(eq(manychatIntegrations.id, id));
  }
} 