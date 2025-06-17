import { BaseStorage } from '../base/BaseStorage';
import { facebookIntegrations, FacebookIntegration, InsertFacebookIntegration } from '../../../shared/schema';
import { eq, desc } from 'drizzle-orm';

export class FacebookIntegrationOperations extends BaseStorage {
  async getIntegrations(): Promise<FacebookIntegration[]> {
    return this.db.select().from(facebookIntegrations).orderBy(desc(facebookIntegrations.createdAt));
  }

  async getIntegration(id: number): Promise<FacebookIntegration | undefined> {
    const result = await this.db.select().from(facebookIntegrations).where(eq(facebookIntegrations.id, id)).limit(1);
    return result[0];
  }

  async getActiveIntegration(): Promise<FacebookIntegration | undefined> {
    const result = await this.db.select().from(facebookIntegrations).where(eq(facebookIntegrations.isActive, true)).limit(1);
    return result[0];
  }

  async createIntegration(integration: InsertFacebookIntegration): Promise<FacebookIntegration> {
    const result = await this.db.insert(facebookIntegrations).values(integration).returning();
    return result[0];
  }

  async updateIntegration(id: number, updates: Partial<InsertFacebookIntegration>): Promise<FacebookIntegration> {
    const result = await this.db.update(facebookIntegrations).set({ ...updates, updatedAt: new Date() }).where(eq(facebookIntegrations.id, id)).returning();
    if (result.length === 0) throw new Error('Integração Facebook não encontrada');
    return result[0];
  }

  async deleteIntegration(id: number): Promise<void> {
    await this.db.delete(facebookIntegrations).where(eq(facebookIntegrations.id, id));
  }

  async updateIntegrationStatus(id: number, isActive: boolean): Promise<void> {
    if (isActive) {
      await this.db.update(facebookIntegrations).set({ isActive: false }).where(eq(facebookIntegrations.isActive, true));
    }
    await this.db.update(facebookIntegrations).set({ isActive, updatedAt: new Date() }).where(eq(facebookIntegrations.id, id));
  }
} 