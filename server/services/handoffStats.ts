import { db } from '../db';
import { handoffs, teams } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export class HandoffStats {
  /**
   * Obter estatísticas de handoffs
   */
  async getHandoffStats(days: number = 7): Promise<{
    total: number;
    pending: number;
    completed: number;
    rejected: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const allHandoffs = await db
      .select()
      .from(handoffs);

    const stats = {
      total: allHandoffs.length,
      pending: allHandoffs.filter(h => h.status === 'pending').length,
      completed: allHandoffs.filter(h => h.status === 'completed').length,
      rejected: allHandoffs.filter(h => h.status === 'rejected').length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };

    // Agrupar por tipo
    allHandoffs.forEach(handoff => {
      stats.byType[handoff.type] = (stats.byType[handoff.type] || 0) + 1;
      if (handoff.priority) {
        stats.byPriority[handoff.priority] = (stats.byPriority[handoff.priority] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Analisar capacidades das equipes
   */
  async analyzeTeamCapacities(): Promise<Record<number, number>> {
    const teams = await db.select().from(teams);
    const capacities: Record<number, number> = {};

    for (const team of teams) {
      // Contar conversas ativas atribuídas à equipe
      const activeConversations = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.assignedTeamId, team.id),
            eq(conversations.status, 'open')
          )
        );

      capacities[team.id] = activeConversations.length;
    }

    return capacities;
  }
} 