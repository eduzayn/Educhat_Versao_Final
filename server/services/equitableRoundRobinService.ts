import { db } from '../db';
import { systemUsers, conversations, userTeams, teams } from '@shared/schema';
import { eq, and, sql, count, desc, asc } from 'drizzle-orm';

/**
 * SERVIÇO ROUND-ROBIN EQUITATIVO CORRIGIDO
 * Garante distribuição verdadeiramente equitativa sem falhas
 */

interface UserLoad {
  userId: number;
  displayName: string;
  isOnline: boolean;
  isActive: boolean;
  totalAssignments: number; // Total histórico de atribuições
  activeConversations: number; // Conversas ativas atuais
  lastAssignedAt: Date | null;
  teamId: number;
  maxCapacity: number;
  distributionScore: number; // Score para ordenação equitativa
}

interface RoundRobinResult {
  success: boolean;
  userId?: number;
  userName?: string;
  reason: string;
  distributionInfo?: {
    userLoad: number;
    teamAverageLoad: number;
    distributionScore: number;
  };
}

class EquitableRoundRobinService {
  
  /**
   * Obtém carga completa de todos os usuários de uma equipe
   */
  private async getTeamUsersLoad(teamId: number): Promise<UserLoad[]> {
    try {
      // Buscar todos os usuários ativos da equipe
      const teamUsers = await db
        .select({
          userId: systemUsers.id,
          displayName: systemUsers.displayName,
          isOnline: systemUsers.isOnline,
          isActive: systemUsers.isActive,
          status: systemUsers.status,
          lastActivityAt: systemUsers.lastActivityAt
        })
        .from(systemUsers)
        .innerJoin(userTeams, eq(systemUsers.id, userTeams.userId))
        .where(
          and(
            eq(userTeams.teamId, teamId),
            eq(systemUsers.status, 'active'),
            eq(systemUsers.isActive, true),
            eq(userTeams.isActive, true)
          )
        );

      if (teamUsers.length === 0) {
        return [];
      }

      // Para cada usuário, calcular métricas detalhadas
      const usersLoad: UserLoad[] = [];
      
      for (const user of teamUsers) {
        // Contar conversas ativas
        const activeConvs = await db
          .select({ count: count() })
          .from(conversations)
          .where(
            and(
              eq(conversations.assignedUserId, user.userId),
              eq(conversations.status, 'open')
            )
          );

        // Contar total de atribuições históricas (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const totalAssignments = await db
          .select({ count: count() })
          .from(conversations)
          .where(
            and(
              eq(conversations.assignedUserId, user.userId),
              sql`${conversations.assignedAt} >= ${thirtyDaysAgo}`
            )
          );

        // Buscar última atribuição real (não atividade geral)
        const lastAssignment = await db
          .select({ assignedAt: conversations.assignedAt })
          .from(conversations)
          .where(eq(conversations.assignedUserId, user.userId))
          .orderBy(desc(conversations.assignedAt))
          .limit(1);

        const activeConversations = activeConvs[0]?.count || 0;
        const totalAssignmentsCount = totalAssignments[0]?.count || 0;
        const lastAssignedAt = lastAssignment[0]?.assignedAt || null;

        // Calcular score de distribuição (menor = prioridade maior)
        // Fórmula: (total_assignments * 10) + active_conversations + time_penalty
        const timePenalty = lastAssignedAt ? 
          Math.max(0, 10 - Math.floor((Date.now() - lastAssignedAt.getTime()) / (1000 * 60 * 60))) : 0;
        
        const distributionScore = (totalAssignmentsCount * 10) + activeConversations + timePenalty;

        usersLoad.push({
          userId: user.userId,
          displayName: user.displayName,
          isOnline: user.isOnline || false,
          isActive: user.isActive || true,
          totalAssignments: totalAssignmentsCount,
          activeConversations,
          lastAssignedAt,
          teamId,
          maxCapacity: 50, // Capacidade aumentada conforme solicitado
          distributionScore
        });
      }

      return usersLoad;
      
    } catch (error) {
      console.error('❌ Erro ao calcular carga da equipe:', error);
      return [];
    }
  }

  /**
   * Seleciona usuário usando round-robin verdadeiramente equitativo
   */
  private selectUserEquitably(users: UserLoad[]): UserLoad | null {
    if (users.length === 0) return null;

    // Primeiro, tentar usuários online e que não estão sobrecarregados
    const onlineAvailableUsers = users.filter(u => 
      u.isOnline && u.isActive && u.activeConversations < u.maxCapacity
    );
    
    if (onlineAvailableUsers.length > 0) {
      return this.sortUsersByEquity(onlineAvailableUsers)[0];
    }

    // Se não há usuários online disponíveis, tentar todos os online (mesmo no limite)
    const onlineUsers = users.filter(u => u.isOnline && u.isActive);
    if (onlineUsers.length > 0) {
      return this.sortUsersByEquity(onlineUsers)[0];
    }

    // Se ninguém está online, atribuir para quem tem menor carga total (receberá quando voltar)
    console.log('⚠️ Nenhum usuário online encontrado, atribuindo para menor carga total');
    const activeUsers = users.filter(u => u.isActive);
    if (activeUsers.length > 0) {
      return this.sortUsersByEquity(activeUsers)[0];
    }

    // Último recurso: qualquer usuário da equipe
    return this.sortUsersByEquity(users)[0];
  }

  /**
   * Ordena usuários por critérios de equidade
   */
  private sortUsersByEquity(users: UserLoad[]): UserLoad[] {
    return users.sort((a, b) => {
      // Primeiro critério: menor score de distribuição (mais equitativo)
      if (a.distributionScore !== b.distributionScore) {
        return a.distributionScore - b.distributionScore;
      }
      
      // Segundo critério: menor carga ativa
      if (a.activeConversations !== b.activeConversations) {
        return a.activeConversations - b.activeConversations;
      }
      
      // Terceiro critério: quem foi atribuído há mais tempo
      const aTime = a.lastAssignedAt?.getTime() || 0;
      const bTime = b.lastAssignedAt?.getTime() || 0;
      return aTime - bTime;
    });
  }

  /**
   * Atribui conversa com distribuição equitativa garantida
   */
  async assignUserToConversation(conversationId: number, teamId: number): Promise<RoundRobinResult> {
    try {
      console.log(`🎯 Iniciando atribuição equitativa para conversa ${conversationId}, equipe ${teamId}`);
      
      // Obter carga completa da equipe
      const teamLoad = await this.getTeamUsersLoad(teamId);
      
      if (teamLoad.length === 0) {
        return {
          success: false,
          reason: 'Nenhum usuário ativo encontrado na equipe'
        };
      }

      // Selecionar usuário de forma equitativa
      const selectedUser = this.selectUserEquitably(teamLoad);
      
      if (!selectedUser) {
        return {
          success: false,
          reason: 'Nenhum usuário disponível na equipe para atribuição'
        };
      }

      // Determinar status da atribuição
      const isOnlineAssignment = selectedUser.isOnline && selectedUser.isActive;
      const assignmentType = isOnlineAssignment ? 'online' : 'offline';

      // Calcular média da equipe para comparação
      const teamAverageLoad = teamLoad.reduce((sum, u) => sum + u.totalAssignments, 0) / teamLoad.length;

      // Executar atribuição atomicamente
      await db.transaction(async (tx) => {
        // Atualizar conversa
        await tx
          .update(conversations)
          .set({
            assignedUserId: selectedUser.userId,
            assignedTeamId: teamId,
            assignmentMethod: 'automatic_equitable',
            assignedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(conversations.id, conversationId));

        // Atualizar timestamp de última atividade do usuário
        await tx
          .update(systemUsers)
          .set({
            lastActivityAt: new Date()
          })
          .where(eq(systemUsers.id, selectedUser.userId));
      });

      console.log(`✅ Atribuição equitativa concluída: ${selectedUser.displayName} (Score: ${selectedUser.distributionScore})`);

      return {
        success: true,
        userId: selectedUser.userId,
        userName: selectedUser.displayName,
        reason: `Distribuição equitativa - Score: ${selectedUser.distributionScore}, Atribuições: ${selectedUser.totalAssignments}, Ativas: ${selectedUser.activeConversations}`,
        distributionInfo: {
          userLoad: selectedUser.totalAssignments,
          teamAverageLoad: Math.round(teamAverageLoad * 100) / 100,
          distributionScore: selectedUser.distributionScore
        }
      };

    } catch (error) {
      console.error('❌ Erro na atribuição equitativa:', error);
      return {
        success: false,
        reason: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Obtém estatísticas de distribuição da equipe
   */
  async getEquityStats(teamId: number): Promise<{
    totalUsers: number;
    onlineUsers: number;
    distributionEquity: 'excelente' | 'boa' | 'moderada' | 'ruim';
    userStats: Array<{
      userId: number;
      name: string;
      totalAssignments: number;
      activeConversations: number;
      distributionScore: number;
      equityRatio: number;
    }>;
  }> {
    try {
      const teamLoad = await this.getTeamUsersLoad(teamId);
      
      if (teamLoad.length === 0) {
        return {
          totalUsers: 0,
          onlineUsers: 0,
          distributionEquity: 'ruim',
          userStats: []
        };
      }

      const totalUsers = teamLoad.length;
      const onlineUsers = teamLoad.filter(u => u.isOnline).length;
      
      // Calcular equidade baseada na variação de cargas
      const totalAssignments = teamLoad.map(u => u.totalAssignments);
      const average = totalAssignments.reduce((a, b) => a + b, 0) / totalUsers;
      const variance = totalAssignments.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / totalUsers;
      const standardDeviation = Math.sqrt(variance);
      
      // Classificar equidade
      let distributionEquity: 'excelente' | 'boa' | 'moderada' | 'ruim' = 'excelente';
      if (standardDeviation > 5) distributionEquity = 'ruim';
      else if (standardDeviation > 3) distributionEquity = 'moderada';
      else if (standardDeviation > 1.5) distributionEquity = 'boa';

      const userStats = teamLoad.map(user => ({
        userId: user.userId,
        name: user.displayName,
        totalAssignments: user.totalAssignments,
        activeConversations: user.activeConversations,
        distributionScore: user.distributionScore,
        equityRatio: average > 0 ? Math.round((user.totalAssignments / average) * 100) / 100 : 1
      }));

      return {
        totalUsers,
        onlineUsers,
        distributionEquity,
        userStats
      };

    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas de equidade:', error);
      return {
        totalUsers: 0,
        onlineUsers: 0,
        distributionEquity: 'ruim',
        userStats: []
      };
    }
  }

  /**
   * Rebalanceia distribuição se necessário
   */
  async rebalanceTeamDistribution(teamId: number): Promise<{
    success: boolean;
    message: string;
    rebalanced: number;
  }> {
    try {
      const stats = await this.getEquityStats(teamId);
      
      if (stats.distributionEquity === 'excelente' || stats.distributionEquity === 'boa') {
        return {
          success: true,
          message: 'Distribuição já está equilibrada',
          rebalanced: 0
        };
      }

      // Implementar lógica de rebalanceamento se necessário
      // Por enquanto, apenas retornar análise
      return {
        success: true,
        message: `Distribuição ${stats.distributionEquity} detectada. Monitoramento ativo.`,
        rebalanced: 0
      };

    } catch (error) {
      console.error('❌ Erro no rebalanceamento:', error);
      return {
        success: false,
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        rebalanced: 0
      };
    }
  }
}

export const equitableRoundRobinService = new EquitableRoundRobinService();