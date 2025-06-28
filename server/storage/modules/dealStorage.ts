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
    const { page = 1, limit = 10, stage, contactId, userId, teamId, teamType } = params;
    const offset = (page - 1) * limit;

    let query = this.db.select().from(deals);
    const conditions = [];

    if (stage) conditions.push(eq(deals.stage, stage));
    if (contactId) conditions.push(eq(deals.contactId, contactId));
    if (userId) conditions.push(eq(deals.assignedUserId, userId));
    if (teamType) conditions.push(eq(deals.teamType, teamType));

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
      totalPages: Math.ceil(totalResult.count / limit),
      currentPage: page
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

  async addDealNote(dealId: number, noteData: { content: string; authorId: number }): Promise<any> {
    // Implementar quando necessário - por enquanto retorna sucesso
    return { id: Date.now(), dealId, ...noteData, createdAt: new Date() };
  }

  async getDealNotes(dealId: number): Promise<any[]> {
    // Implementar quando necessário - por enquanto retorna array vazio
    return [];
  }

  async getDealStatistics(filters?: any): Promise<any> {
    // Implementar quando necessário - por enquanto retorna estatísticas básicas
    return {
      totalDeals: 0,
      activeDeals: 0,
      closedDeals: 0,
      totalValue: 0,
      averageValue: 0
    };
  }

  async createAutomaticDeal(contactId: number, canalOrigem?: string, teamType?: string): Promise<Deal> {
    console.log(`💼 Criando deal automático: contato=${contactId}, canal=${canalOrigem}, equipe=${teamType}`);
    
    // Verificação única com SQL otimizada para deals ativos existentes
    const [existingDeal] = await this.db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.contactId, contactId),
          eq(deals.canalOrigem, canalOrigem || 'automatic'),
          sql`stage NOT IN ('closed', 'lost', 'closed_won', 'closed_lost')`
        )
      )
      .limit(1);

    if (existingDeal) {
      console.log(`⚠️ Deal ativo já existe: ID ${existingDeal.id} para contato ${contactId}`);
      return existingDeal;
    }

    // Buscar dados do contato
    const [contact] = await this.db.select().from(contacts).where(eq(contacts.id, contactId));
    if (!contact) {
      throw new Error(`Contato ${contactId} não encontrado`);
    }

    // Criar deal automático
    const dealData: InsertDeal = {
      name: `${contact.name} - ${teamType || 'Geral'}`,
      contactId: contactId,
      stage: 'prospecting',
      value: 0,
      probability: 50,
      owner: 'Sistema',
      canalOrigem: canalOrigem || 'automatic',
      notes: `Deal criado automaticamente via ${canalOrigem || 'sistema'}`,
      teamType: teamType || 'comercial',
      tags: {
        automatic: true,
        canalOrigem,
        teamType,
        createdBy: 'system'
      }
    };
    
    try {
      const newDeal = await this.createDeal(dealData);
      console.log(`✅ Deal criado com sucesso: ID ${newDeal.id} para ${contact.name}`);
      return newDeal;
    } catch (error) {
      console.error(`❌ Erro ao criar deal para contato ${contactId}:`, error);
      
      // Fallback simples: buscar deal existente
      const [fallbackDeal] = await this.db
        .select()
        .from(deals)
        .where(
          and(
            eq(deals.contactId, contactId),
            eq(deals.canalOrigem, canalOrigem || 'automatic'),
            sql`stage NOT IN ('closed', 'lost', 'closed_won', 'closed_lost')`
          )
        )
        .limit(1);
      
      if (fallbackDeal) {
        console.log(`🔄 Retornando deal existente como fallback: ID ${fallbackDeal.id}`);
        return fallbackDeal;
      }
      
      throw error;
    }
  }

  async cleanupDuplicateDeals(): Promise<{ removed: number; details: any[] }> {
    console.log('🧹 Limpeza simplificada de deals duplicados...');
    
    // Query SQL direta para encontrar duplicatas: mesmo contato, canal e status ativo
    const duplicatesQuery = sql`
      WITH ranked_deals AS (
        SELECT 
          id,
          contact_id,
          canal_origem,
          team_type,
          stage,
          created_at,
          ROW_NUMBER() OVER (
            PARTITION BY contact_id, canal_origem, team_type 
            ORDER BY created_at DESC
          ) as rn
        FROM deals 
        WHERE stage NOT IN ('closed', 'lost', 'closed_won', 'closed_lost')
      )
      SELECT id FROM ranked_deals WHERE rn > 1
    `;
    
    const duplicateIds = await this.db.execute(duplicatesQuery);
    const idsToRemove = duplicateIds.rows.map((row: any) => row.id);
    
    if (idsToRemove.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada');
      return { removed: 0, details: [] };
    }
    
    // Remover duplicatas em uma única operação
    await this.db.delete(deals).where(sql`id = ANY(${idsToRemove})`);
    
    console.log(`🧹 Limpeza concluída: ${idsToRemove.length} deals duplicados removidos`);
    
    return {
      removed: idsToRemove.length,
      details: idsToRemove.map(id => ({ removed: { id }, reason: 'Duplicate active deal' }))
    };
  }
}