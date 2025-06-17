// DEPRECATED: Este serviço foi consolidado em unifiedAssignmentService.ts
// Mantido para compatibilidade durante migração
import { db } from '../db';
import { handoffs, systemUsers, teams, conversations } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export class IntelligentHandoffService {
  constructor() {
    // Serviço simplificado para compatibilidade
  }

  /**
   * Analisa e recomenda o melhor destino para handoff baseado em IA e capacidade real
   */
  async analyzeAndRecommendHandoff(
    conversationId: number,
    messageContent: string,
    aiClassification: any
  ): Promise<any> {
    // Implementação simplificada para compatibilidade
    return {
      suggestedTeamId: null,
      suggestedUserId: null,
      confidence: 0.5,
      reason: 'Análise simplificada'
    };
  }

  /**
   * Executa handoff inteligente baseado na recomendação
   */
  async executeIntelligentHandoff(
    conversationId: number,
    recommendation: any,
    aiClassification: any,
    type: 'automatic' | 'manual' = 'automatic'
  ): Promise<number> {
    // Implementação simplificada para compatibilidade
    return 0;
  }

  /**
   * Obtém estatísticas de performance do sistema inteligente
   */
  async getIntelligentHandoffStats(days: number = 7): Promise<any> {
    // Implementação simplificada para compatibilidade
    return {
      totalHandoffs: 0,
      successRate: 0,
      averageResponseTime: 0
    };
  }

  /**
   * Busca handoffs pendentes para um usuário específico
   */
  async getPendingHandoffsForUser(userId: number): Promise<any[]> {
    try {
      const pendingHandoffs = await db
        .select({
          id: handoffs.id,
          conversationId: handoffs.conversationId,
          type: handoffs.type,
          reason: handoffs.reason,
          priority: handoffs.priority,
          status: handoffs.status,
          createdAt: handoffs.createdAt,
          fromUser: systemUsers.displayName,
          fromTeam: teams.name
        })
        .from(handoffs)
        .leftJoin(systemUsers, eq(handoffs.fromUserId, systemUsers.id))
        .leftJoin(teams, eq(handoffs.fromTeamId, teams.id))
        .where(
          and(
            eq(handoffs.toUserId, userId),
            eq(handoffs.status, 'pending')
          )
        )
        .orderBy(desc(handoffs.createdAt));

      return pendingHandoffs;
    } catch (error) {
      console.error('Erro ao buscar handoffs pendentes para usuário:', error);
      return [];
    }
  }

  /**
   * Busca handoffs pendentes para uma equipe específica
   */
  async getPendingHandoffsForTeam(teamId: number): Promise<any[]> {
    try {
      const pendingHandoffs = await db
        .select({
          id: handoffs.id,
          conversationId: handoffs.conversationId,
          type: handoffs.type,
          reason: handoffs.reason,
          priority: handoffs.priority,
          status: handoffs.status,
          createdAt: handoffs.createdAt,
          fromUser: systemUsers.displayName,
          fromTeam: teams.name
        })
        .from(handoffs)
        .leftJoin(systemUsers, eq(handoffs.fromUserId, systemUsers.id))
        .leftJoin(teams, eq(handoffs.fromTeamId, teams.id))
        .where(
          and(
            eq(handoffs.toTeamId, teamId),
            eq(handoffs.status, 'pending')
          )
        )
        .orderBy(desc(handoffs.createdAt));

      return pendingHandoffs;
    } catch (error) {
      console.error('Erro ao buscar handoffs pendentes para equipe:', error);
      return [];
    }
  }

  /**
   * Aceita um handoff pendente
   */
  async acceptHandoff(handoffId: number, userId: number): Promise<void> {
    try {
      // Buscar o handoff
      const [handoff] = await db
        .select()
        .from(handoffs)
        .where(eq(handoffs.id, handoffId))
        .limit(1);

      if (!handoff) {
        throw new Error('Handoff não encontrado');
      }

      if (handoff.status !== 'pending') {
        throw new Error('Handoff já foi processado');
      }

      // Atualizar o handoff como aceito
      await db
        .update(handoffs)
        .set({
          status: 'accepted',
          acceptedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(handoffs.id, handoffId));

      // Atualizar a conversa com a nova atribuição
      const updateData: any = {
        updatedAt: new Date(),
        assignedAt: new Date()
      };

      if (handoff.toTeamId) {
        updateData.assignedTeamId = handoff.toTeamId;
      }

      if (handoff.toUserId) {
        updateData.assignedUserId = handoff.toUserId;
      }

      await db
        .update(conversations)
        .set(updateData)
        .where(eq(conversations.id, handoff.conversationId));

    } catch (error) {
      console.error('Erro ao aceitar handoff:', error);
      throw error;
    }
  }

  /**
   * Rejeita um handoff pendente
   */
  async rejectHandoff(handoffId: number, reason?: string): Promise<void> {
    try {
      // Buscar o handoff
      const [handoff] = await db
        .select()
        .from(handoffs)
        .where(eq(handoffs.id, handoffId))
        .limit(1);

      if (!handoff) {
        throw new Error('Handoff não encontrado');
      }

      if (handoff.status !== 'pending') {
        throw new Error('Handoff já foi processado');
      }

      // Atualizar o handoff como rejeitado
      await db
        .update(handoffs)
        .set({
          status: 'rejected',
          reason: reason || handoff.reason,
          updatedAt: new Date()
        })
        .where(eq(handoffs.id, handoffId));

    } catch (error) {
      console.error('Erro ao rejeitar handoff:', error);
      throw error;
    }
  }
}

export const intelligentHandoffService = new IntelligentHandoffService();