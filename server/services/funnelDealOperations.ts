import { db } from '../db';
import { deals, funnels, contacts } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Operações de negócios para funis de vendas
 */

export interface DealCreationData {
  contactId: number;
  name: string;
  value?: number;
  teamType?: string;
  stage?: string;
  course?: string;
  category?: string;
}

export interface FunnelStage {
  id: string;
  name: string;
  order: number;
  color?: string;
  probability?: number;
}

export class FunnelDealOperations {
  
  /**
   * Cria um novo deal no funil apropriado
   */
  async createDeal(dealData: DealCreationData): Promise<any> {
    try {
      // Buscar funil apropriado baseado no teamType
      const targetFunnel = await this.getFunnelByTeamType(dealData.teamType || 'comercial');
      
      if (!targetFunnel) {
        throw new Error(`Funil não encontrado para o tipo de equipe: ${dealData.teamType}`);
      }

      // Obter primeiro estágio do funil
      const stages = targetFunnel.stages as FunnelStage[];
      const firstStage = stages.sort((a, b) => a.order - b.order)[0];

      const newDeal = await db
        .insert(deals)
        .values({
          name: dealData.name,
          contactId: dealData.contactId,
          teamType: dealData.teamType || 'comercial',
          funnelId: targetFunnel.id,
          stage: dealData.stage || firstStage.id,
          value: dealData.value || 0,
          course: dealData.course,
          category: dealData.category,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newDeal[0];

    } catch (error) {
      console.error('Erro ao criar deal:', error);
      throw error;
    }
  }

  /**
   * Move deal para outro estágio
   */
  async moveDealToStage(dealId: number, newStageId: string): Promise<boolean> {
    try {
      await db
        .update(deals)
        .set({
          stage: newStageId,
          updatedAt: new Date()
        })
        .where(eq(deals.id, dealId));

      return true;

    } catch (error) {
      console.error('Erro ao mover deal:', error);
      return false;
    }
  }

  /**
   * Busca funil por tipo de equipe
   */
  async getFunnelByTeamType(teamType: string): Promise<any> {
    try {
      const funnel = await db
        .select()
        .from(funnels)
        .where(and(
          eq(funnels.teamType, teamType),
          eq(funnels.isActive, true)
        ))
        .limit(1);

      return funnel[0] || null;

    } catch (error) {
      console.error('Erro ao buscar funil:', error);
      return null;
    }
  }

  /**
   * Lista deals de um funil
   */
  async getDealsByFunnel(funnelId: number): Promise<any[]> {
    try {
      const funnelDeals = await db
        .select({
          id: deals.id,
          name: deals.name,
          value: deals.value,
          stage: deals.stage,
          contactId: deals.contactId,
          createdAt: deals.createdAt
        })
        .from(deals)
        .where(eq(deals.funnelId, funnelId))
        .orderBy(desc(deals.createdAt));

      return funnelDeals;

    } catch (error) {
      console.error('Erro ao buscar deals do funil:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas do funil
   */
  async getFunnelStats(funnelId: number): Promise<{
    totalDeals: number;
    totalValue: number;
    stageDistribution: Record<string, number>;
  }> {
    try {
      const funnelDeals = await this.getDealsByFunnel(funnelId);
      
      const totalDeals = funnelDeals.length;
      const totalValue = funnelDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      
      const stageDistribution: Record<string, number> = {};
      funnelDeals.forEach(deal => {
        stageDistribution[deal.stage] = (stageDistribution[deal.stage] || 0) + 1;
      });

      return {
        totalDeals,
        totalValue,
        stageDistribution
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas do funil:', error);
      return {
        totalDeals: 0,
        totalValue: 0,
        stageDistribution: {}
      };
    }
  }
}