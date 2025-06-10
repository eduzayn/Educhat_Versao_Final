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

  async createAutomaticDeal(contactId: number, canalOrigem?: string, macrosetor?: string): Promise<Deal> {
    // Verificação robusta para evitar duplicação durante criação
    const existingDeals = await this.getDealsByContact(contactId);
    
    // Verificar se já existe qualquer deal ativo para este contato no mesmo canal
    const hasActiveDealSameChannel = existingDeals.some(deal => {
      const isActive = deal.stage !== 'closed' && deal.stage !== 'lost' && deal.stage !== 'closed_won' && deal.stage !== 'closed_lost';
      const sameChannel = deal.canalOrigem === canalOrigem;
      return isActive && sameChannel;
    });

    if (hasActiveDealSameChannel) {
      console.log(`⚠️ Deal ativo já existe para contato ${contactId} no canal ${canalOrigem}, evitando duplicação`);
      const activeDeal = existingDeals.find(deal => {
        const isActive = deal.stage !== 'closed' && deal.stage !== 'lost' && deal.stage !== 'closed_won' && deal.stage !== 'closed_lost';
        return isActive && deal.canalOrigem === canalOrigem;
      });
      return activeDeal!;
    }

    // Verificar se já existe um deal muito recente (últimas 2 horas) para este contato/canal
    const veryRecentDeals = existingDeals.filter(deal => {
      if (!deal.createdAt) return false;
      const dealDate = new Date(deal.createdAt!);
      const now = new Date();
      const hoursDiff = (now.getTime() - dealDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff < 2 && deal.canalOrigem === canalOrigem;
    });

    if (veryRecentDeals.length > 0) {
      console.log(`⚠️ Deal muito recente encontrado para contato ${contactId} no canal ${canalOrigem}, evitando duplicação`);
      return veryRecentDeals[0];
    }

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

    // Gerar nome único para o deal baseado no timestamp
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const dealName = `${contact.name} - ${macrosetor || 'Geral'}`;

    // Verificação final antes da criação para evitar condições de corrida
    const finalCheck = await this.getDealsByContact(contactId);
    const lastMinuteActiveDeal = finalCheck.find(deal => {
      const isActive = deal.stage !== 'closed' && deal.stage !== 'lost' && deal.stage !== 'closed_won' && deal.stage !== 'closed_lost';
      return isActive && deal.canalOrigem === canalOrigem;
    });

    if (lastMinuteActiveDeal) {
      console.log(`⚠️ Deal ativo detectado na verificação final para contato ${contactId}, retornando deal existente`);
      return lastMinuteActiveDeal;
    }

    // Create automatic deal
    const dealData: InsertDeal = {
      name: dealName,
      contactId: contactId,
      stage: 'prospecting',
      value: 0,
      probability: 50,
      owner: 'Sistema',
      canalOrigem: canalOrigem || 'automatic',
      macrosetor: macrosetor || 'geral',
      notes: `Deal criado automaticamente via ${canalOrigem || 'sistema'} em ${timestamp}`,
      tags: {
        automatic: true,
        canalOrigem,
        macrosetor,
        createdBy: 'system',
        timestamp: timestamp
      }
    };

    console.log(`💼 Criando deal automático: ${dealName} para ${contact.name}`);
    return this.createDeal(dealData);
  }

  async cleanupDuplicateDeals(): Promise<{ removed: number; details: any[] }> {
    console.log('🧹 Iniciando limpeza de deals duplicados...');
    
    // Buscar todos os deals ativos
    const allDeals = await this.db.select().from(deals).orderBy(deals.contactId, deals.createdAt);
    
    // Agrupar deals por contato e macrosetor
    const dealGroups = new Map();
    
    for (const deal of allDeals) {
      const key = `${deal.contactId}-${deal.macrosetor}-${deal.canalOrigem}`;
      if (!dealGroups.has(key)) {
        dealGroups.set(key, []);
      }
      dealGroups.get(key).push(deal);
    }
    
    // Identificar e remover duplicatas
    const toRemove = [];
    const details = [];
    
    for (const [key, deals] of dealGroups) {
      if (deals.length > 1) {
        // Manter apenas o deal mais recente
        const sortedDeals = deals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const keepDeal = sortedDeals[0];
        const duplicates = sortedDeals.slice(1);
        
        for (const duplicate of duplicates) {
          toRemove.push(duplicate.id);
          details.push({
            removed: duplicate,
            kept: keepDeal,
            reason: 'Duplicate deal for same contact/macrosetor/channel'
          });
        }
      }
    }
    
    // Executar remoção
    for (const dealId of toRemove) {
      await this.db.delete(deals).where(eq(deals.id, dealId));
    }
    
    console.log(`🧹 Limpeza concluída: ${toRemove.length} deals duplicados removidos`);
    
    return {
      removed: toRemove.length,
      details
    };
  }
}