import { db } from '../db';
import { systemUsers, conversations, userTeams } from '@shared/schema';
import { eq, and, sql, count, desc } from 'drizzle-orm';

/**
 * Serviço de Round-Robin para atribuição automática de usuários
 * Implementa lógica inteligente de distribuição considerando horários de trabalho
 */

interface UserAvailability {
  id: number;
  displayName: string;
  isOnline: boolean;
  currentLoad: number;
  maxCapacity: number;
  lastAssignedAt: Date | null;
  workingHours: {
    start: string;
    end: string;
    timezone: string;
  };
}

interface RoundRobinResult {
  success: boolean;
  userId?: number;
  userName?: string;
  reason: string;
  method: 'round_robin' | 'availability' | 'fallback';
}

class RoundRobinService {
  
  /**
   * Verifica se é horário comercial (8h às 18h, seg-sex)
   */
  private isBusinessHours(): boolean {
    const now = new Date();
    const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    
    const hour = brazilTime.getHours();
    const day = brazilTime.getDay(); // 0 = domingo, 1-6 = seg-sab
    
    // Seg-Sex (1-5) das 8h às 18h
    return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
  }

  /**
   * Obtém usuários disponíveis de uma equipe específica
   */
  private async getAvailableUsersInTeam(teamId: number): Promise<UserAvailability[]> {
    try {
      // Buscar usuários da equipe
      const teamUsers = await db
        .select({
          id: systemUsers.id,
          displayName: systemUsers.displayName,
          isOnline: systemUsers.isOnline,
          status: systemUsers.status,
          lastActivityAt: systemUsers.lastActivityAt
        })
        .from(systemUsers)
        .innerJoin(userTeams, eq(systemUsers.id, userTeams.userId))
        .where(
          and(
            eq(userTeams.teamId, teamId),
            eq(systemUsers.status, 'active'),
            eq(userTeams.isActive, true)
          )
        );

      if (teamUsers.length === 0) {
        return [];
      }

      // Para cada usuário, calcular carga atual
      const usersWithLoad = await Promise.all(
        teamUsers.map(async (user) => {
          // Contar conversas atribuídas ao usuário
          const loadResult = await db
            .select({ count: count() })
            .from(conversations)
            .where(
              and(
                eq(conversations.assignedUserId, user.id),
                eq(conversations.status, 'open')
              )
            );

          const currentLoad = loadResult[0]?.count || 0;

          return {
            id: user.id,
            displayName: user.displayName,
            isOnline: user.isOnline || false,
            currentLoad,
            maxCapacity: 10, // Valor padrão fixo
            lastAssignedAt: user.lastActivityAt, // Usar lastActivityAt como referência
            workingHours: {
              start: '08:00',
              end: '18:00',
              timezone: 'America/Sao_Paulo'
            }
          };
        })
      );

      return usersWithLoad;
    } catch (error) {
      console.error('Erro ao buscar usuários da equipe:', error);
      return [];
    }
  }

  /**
   * Seleciona o próximo usuário usando round-robin inteligente
   */
  private selectNextUserRoundRobin(users: UserAvailability[]): UserAvailability | null {
    if (users.length === 0) return null;

    const isBusinessTime = this.isBusinessHours();
    
    // Durante horário comercial: priorizar usuários online com menor carga
    if (isBusinessTime) {
      const onlineUsers = users.filter(u => u.isOnline && u.currentLoad < u.maxCapacity);
      
      if (onlineUsers.length > 0) {
        // Ordenar por carga atual (menor primeiro) e depois por última atribuição
        return onlineUsers.sort((a, b) => {
          if (a.currentLoad !== b.currentLoad) {
            return a.currentLoad - b.currentLoad;
          }
          
          // Se cargas iguais, priorizar quem foi atribuído há mais tempo
          const aTime = a.lastAssignedAt?.getTime() || 0;
          const bTime = b.lastAssignedAt?.getTime() || 0;
          return aTime - bTime;
        })[0];
      }
    }

    // Fora do horário comercial ou sem usuários online: usar round-robin simples
    // Filtrar usuários com capacidade disponível
    const availableUsers = users.filter(u => u.currentLoad < u.maxCapacity);
    
    if (availableUsers.length === 0) {
      // Se todos estão no limite, pegar o com menor carga
      return users.sort((a, b) => a.currentLoad - b.currentLoad)[0];
    }

    // Round-robin baseado na última atribuição
    return availableUsers.sort((a, b) => {
      const aTime = a.lastAssignedAt?.getTime() || 0;
      const bTime = b.lastAssignedAt?.getTime() || 0;
      return aTime - bTime;
    })[0];
  }

  /**
   * Atribui automaticamente um usuário a uma conversa usando round-robin
   */
  async assignUserToConversation(conversationId: number, teamId: number): Promise<RoundRobinResult> {
    try {
      // Buscar usuários disponíveis da equipe
      const availableUsers = await this.getAvailableUsersInTeam(teamId);
      
      if (availableUsers.length === 0) {
        return {
          success: false,
          reason: 'Nenhum usuário disponível na equipe',
          method: 'fallback'
        };
      }

      // Selecionar próximo usuário
      const selectedUser = this.selectNextUserRoundRobin(availableUsers);
      
      if (!selectedUser) {
        return {
          success: false,
          reason: 'Não foi possível selecionar usuário',
          method: 'fallback'
        };
      }

      // Atualizar conversa com usuário e equipe atribuídos
      await db
        .update(conversations)
        .set({
          assignedUserId: selectedUser.id,
          assignedTeamId: teamId,
          assignmentMethod: 'automatic',
          updatedAt: new Date()
        })
        .where(eq(conversations.id, conversationId));

      // Atualizar timestamp da última atividade do usuário (como referência para próximas atribuições)
      await db
        .update(systemUsers)
        .set({
          lastActivityAt: new Date()
        })
        .where(eq(systemUsers.id, selectedUser.id));

      const method = this.isBusinessHours() && selectedUser.isOnline ? 'availability' : 'round_robin';

      console.log(`🎯 Usuário atribuído automaticamente: ${selectedUser.displayName} (ID: ${selectedUser.id}) para conversa ${conversationId}`);

      return {
        success: true,
        userId: selectedUser.id,
        userName: selectedUser.displayName,
        reason: `Atribuído via ${method} - Carga atual: ${selectedUser.currentLoad}/${selectedUser.maxCapacity}`,
        method
      };

    } catch (error) {
      console.error('Erro na atribuição round-robin:', error);
      return {
        success: false,
        reason: 'Erro interno no sistema de round-robin',
        method: 'fallback'
      };
    }
  }

  /**
   * Obtém estatísticas de distribuição da equipe
   */
  async getTeamDistributionStats(teamId: number): Promise<{
    totalUsers: number;
    onlineUsers: number;
    averageLoad: number;
    distributionBalance: string;
  }> {
    try {
      const users = await this.getAvailableUsersInTeam(teamId);
      
      const totalUsers = users.length;
      const onlineUsers = users.filter(u => u.isOnline).length;
      const totalLoad = users.reduce((sum, u) => sum + u.currentLoad, 0);
      const averageLoad = totalUsers > 0 ? totalLoad / totalUsers : 0;
      
      // Calcular balanceamento (desvio padrão das cargas)
      const variance = users.reduce((sum, u) => sum + Math.pow(u.currentLoad - averageLoad, 2), 0) / totalUsers;
      const stdDev = Math.sqrt(variance);
      
      let distributionBalance = 'equilibrada';
      if (stdDev > 3) distributionBalance = 'desbalanceada';
      else if (stdDev > 1.5) distributionBalance = 'moderada';

      return {
        totalUsers,
        onlineUsers,
        averageLoad: Math.round(averageLoad * 100) / 100,
        distributionBalance
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return {
        totalUsers: 0,
        onlineUsers: 0,
        averageLoad: 0,
        distributionBalance: 'erro'
      };
    }
  }
}

export const roundRobinService = new RoundRobinService();