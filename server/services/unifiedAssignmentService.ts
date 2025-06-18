import { db } from '../db';
import { conversations, teams, systemUsers } from '@shared/schema';
import { eq, and, count } from 'drizzle-orm';
import { aiService } from './aiService';

/**
 * Serviço unificado para atribuição de conversas a equipes e usuários
 */

interface AssignmentResult {
  success: boolean;
  assignedTo?: {
    type: 'team' | 'user';
    id: number;
    name: string;
  };
  reason?: string;
  confidence?: number;
}

interface TeamCapacity {
  teamId: number;
  teamName: string;
  currentLoad: number;
  maxCapacity: number;
  availability: number;
  specializations: string[];
}

class UnifiedAssignmentService {
  
  /**
   * Atribui uma conversa automaticamente baseado em análise de IA e capacidade das equipes
   */
  async assignConversation(
    conversationId: number, 
    messageContent: string,
    context?: string
  ): Promise<AssignmentResult> {
    try {
      // Analisar mensagem com IA
      const analysis = await aiService.analyzeMessage(messageContent, context);
      
      // Obter capacidades das equipes
      const teamCapacities = await this.getTeamCapacities();
      
      // Sugerir equipe baseado na análise
      const teamCapacitiesConverted = teamCapacities.map(tc => ({
        ...tc,
        capacity: tc.maxCapacity
      }));
      const suggestedTeamId = await aiService.suggestTeamAssignment(analysis, teamCapacitiesConverted);
      
      if (!suggestedTeamId) {
        return {
          success: false,
          reason: 'Nenhuma equipe disponível no momento'
        };
      }

      // Encontrar a equipe sugerida
      const targetTeam = teamCapacities.find(team => team.teamId === suggestedTeamId);
      
      if (!targetTeam) {
        return {
          success: false,
          reason: 'Equipe sugerida não encontrada'
        };
      }

      // Atualizar conversa com a equipe atribuída
      await db
        .update(conversations)
        .set({
          assignedTeamId: suggestedTeamId,
          teamType: this.getTeamTypeById(suggestedTeamId),
          assignmentMethod: 'automatic',
          assignedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(conversations.id, conversationId));

      return {
        success: true,
        assignedTo: {
          type: 'team',
          id: suggestedTeamId,
          name: targetTeam.teamName
        },
        confidence: analysis.confidence
      };

    } catch (error) {
      console.error('Erro na atribuição automática:', error);
      return {
        success: false,
        reason: 'Erro interno durante atribuição'
      };
    }
  }

  /**
   * Atribui uma conversa manualmente para uma equipe específica
   */
  async assignToTeam(conversationId: number, teamId: number, userId?: number): Promise<AssignmentResult> {
    try {
      const team = await db
        .select({ id: teams.id, name: teams.name })
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);

      if (team.length === 0) {
        return {
          success: false,
          reason: 'Equipe não encontrada'
        };
      }

      await db
        .update(conversations)
        .set({
          assignedTeamId: teamId,
          teamType: this.getTeamTypeById(teamId),
          assignedUserId: userId || null,
          assignmentMethod: 'manual',
          assignedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(conversations.id, conversationId));

      return {
        success: true,
        assignedTo: {
          type: 'team',
          id: teamId,
          name: team[0].name
        }
      };

    } catch (error) {
      console.error('Erro na atribuição manual:', error);
      return {
        success: false,
        reason: 'Erro interno durante atribuição'
      };
    }
  }

  /**
   * Atribui uma conversa para um usuário específico
   */
  async assignToUser(conversationId: number, userId: number): Promise<AssignmentResult> {
    try {
      const user = await db
        .select({ 
          id: systemUsers.id, 
          displayName: systemUsers.displayName,
          teamId: systemUsers.teamId 
        })
        .from(systemUsers)
        .where(eq(systemUsers.id, userId))
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          reason: 'Usuário não encontrado'
        };
      }

      await db
        .update(conversations)
        .set({
          assignedUserId: userId,
          assignedTeamId: user[0].teamId,
          assignmentMethod: 'manual',
          assignedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(conversations.id, conversationId));

      return {
        success: true,
        assignedTo: {
          type: 'user',
          id: userId,
          name: user[0].displayName
        }
      };

    } catch (error) {
      console.error('Erro na atribuição para usuário:', error);
      return {
        success: false,
        reason: 'Erro interno durante atribuição'
      };
    }
  }

  /**
   * Obtém capacidades de todas as equipes
   */
  async getTeamCapacities(): Promise<TeamCapacity[]> {
    try {
      const allTeams = await db
        .select({
          id: teams.id,
          name: teams.name,
          maxCapacity: teams.maxCapacity
        })
        .from(teams)
        .where(eq(teams.isActive, true));

      const capacities: TeamCapacity[] = [];

      for (const team of allTeams) {
        // Contar conversas ativas da equipe
        const activeConversations = await db
          .select({ count: count() })
          .from(conversations)
          .where(and(
            eq(conversations.assignedTeamId, team.id),
            eq(conversations.status, 'open')
          ));

        const currentLoad = activeConversations[0]?.count || 0;
        const maxCapacity = team.maxCapacity || 10;

        capacities.push({
          teamId: team.id,
          teamName: team.name,
          currentLoad,
          maxCapacity,
          availability: Math.max(0, maxCapacity - currentLoad),
          specializations: ['geral'] // Pode ser expandido conforme necessário
        });
      }

      return capacities;

    } catch (error) {
      console.error('Erro ao obter capacidades das equipes:', error);
      return [];
    }
  }

  /**
   * Remove atribuição de uma conversa
   */
  async unassignConversation(conversationId: number): Promise<AssignmentResult> {
    try {
      await db
        .update(conversations)
        .set({
          assignedTeamId: null,
          assignedUserId: null,
          teamType: null,
          assignmentMethod: 'manual',
          updatedAt: new Date()
        })
        .where(eq(conversations.id, conversationId));

      return {
        success: true,
        reason: 'Conversa removida da atribuição'
      };

    } catch (error) {
      console.error('Erro ao remover atribuição:', error);
      return {
        success: false,
        reason: 'Erro interno ao remover atribuição'
      };
    }
  }

  /**
   * Obtém estatísticas de atribuição
   */
  async getAssignmentStats(): Promise<{
    totalConversations: number;
    assignedConversations: number;
    unassignedConversations: number;
    teamDistribution: Record<string, number>;
  }> {
    try {
      const totalConversations = await db
        .select({ count: count() })
        .from(conversations);

      const assignedConversations = await db
        .select({ count: count() })
        .from(conversations)
        .where(eq(conversations.status, 'open'));

      // Implementação básica - pode ser expandida
      return {
        totalConversations: totalConversations[0]?.count || 0,
        assignedConversations: 0, // A ser calculado
        unassignedConversations: assignedConversations[0]?.count || 0,
        teamDistribution: {}
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalConversations: 0,
        assignedConversations: 0,
        unassignedConversations: 0,
        teamDistribution: {}
      };
    }
  }

  /**
   * Mapeia ID da equipe para tipo (implementação básica)
   */
  private getTeamTypeById(teamId: number): string {
    // Implementação básica - pode ser melhorada com lookup no banco
    const typeMap: Record<number, string> = {
      1: 'comercial',
      2: 'suporte',
      3: 'cobranca',
      4: 'secretaria'
    };
    
    return typeMap[teamId] || 'geral';
  }
}

export const unifiedAssignmentService = new UnifiedAssignmentService();
export default unifiedAssignmentService;