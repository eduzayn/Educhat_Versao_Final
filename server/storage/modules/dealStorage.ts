import { BaseStorage } from "../base/BaseStorage";
import { deals, contacts, teams, type Deal, type InsertDeal } from "@shared/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

/**
 * Deal storage module - manages CRM deals and automatic deal creation
 */
export class DealStorage extends BaseStorage {
  async getDeals(): Promise<Deal[]> {
    return this.db.select().from(deals).orderBy(desc(deals.createdAt));
  }

  async getDealsWithPagination(params: any): Promise<any> {
    const { page = 1, limit = 10, stage, contactId, userId, teamId } = params;
    const offset = (page - 1) * limit;

    let query = this.db.select().from(deals);
    const conditions = [];

    if (stage) conditions.push(eq(deals.stage, stage));
    if (contactId) conditions.push(eq(deals.contactId, contactId));
    if (userId) conditions.push(eq(deals.assignedUserId, userId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query
      .orderBy(desc(deals.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(deals)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      deals: results,
      total: totalResult.count,
      page,
      limit,
      totalPages: Math.ceil(totalResult.count / limit)
    };
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    const [deal] = await this.db.select().from(deals).where(eq(deals.id, id));
    return deal;
  }

  async getDealsByContact(contactId: number): Promise<Deal[]> {
    return this.db.select().from(deals)
      .where(eq(deals.contactId, contactId))
      .orderBy(desc(deals.createdAt));
  }

  async getDealsByStage(stage: string): Promise<Deal[]> {
    return this.db.select().from(deals)
      .where(eq(deals.stage, stage))
      .orderBy(desc(deals.createdAt));
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await this.db.insert(deals).values(deal).returning();
    return newDeal;
  }

  async updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal> {
    const [updated] = await this.db.update(deals)
      .set({ ...deal, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return updated;
  }

  async deleteDeal(id: number): Promise<void> {
    await this.db.delete(deals).where(eq(deals.id, id));
  }

  async createAutomaticDeal(contactId: number, canalOrigem?: string, macrosetor?: string): Promise<Deal> {
    // Get contact information
    const [contact] = await this.db.select().from(contacts).where(eq(contacts.id, contactId));
    if (!contact) {
      throw new Error(`Contact with ID ${contactId} not found`);
    }

    // Find appropriate user based on macrosetor
    let assignedUserId = null;
    if (macrosetor) {
      const [team] = await this.db.select().from(teams).where(eq(teams.macrosetor, macrosetor));
      if (team) {
        // Aqui poderia implementar lógica para encontrar usuário disponível da equipe
        // assignedUserId = team.id;
      }
    }

    // Create automatic deal
    const dealData: InsertDeal = {
      name: `Deal Automático - ${contact.name}`,
      contactId: contactId,
      stage: 'prospecting',
      value: 0,
      probability: 50,
      owner: 'Sistema',
      canalOrigem: canalOrigem || 'automatic',
      macrosetor: macrosetor || 'comercial',
      notes: `Deal criado automaticamente via ${canalOrigem || 'sistema'}`,
      tags: {
        automatic: true,
        canalOrigem,
        macrosetor,
        createdBy: 'system'
      }
    };

    return this.createDeal(dealData);
  }
}