import { Router } from 'express';
import { db } from '../../db';
import { systemUsers, teams, userTeams, conversations } from '@shared/schema';
import { eq, and, sql, count, desc } from 'drizzle-orm';
import { equitableRoundRobinService } from '../../services/equitableRoundRobinService';

const router = Router();

// Interface para dados do rodízio
interface RoundRobinStatus {
  teamId: number;
  teamName: string;
  teamType: string;
  users: Array<{
    userId: number;
    displayName: string;
    isOnline: boolean;
    isActive: boolean;
    position: number;
    totalAssignments: number;
    activeConversations: number;
    distributionScore: number;
    lastAssignedAt: Date | null;
    isNext: boolean;
  }>;
  nextUserId: number | null;
  nextUserName: string | null;
}

/**
 * GET /api/handoffs/round-robin/status
 * Retorna status atual do rodízio por equipe
 */
router.get('/status', async (req, res) => {
  try {
    const { teamType } = req.query;

    // Buscar equipes ativas
    const baseQuery = db
      .select({
        id: teams.id,
        name: teams.name,
        teamType: teams.teamType,
      })
      .from(teams);

    let whereCondition = eq(teams.isActive, true);
    if (teamType && typeof teamType === 'string') {
      whereCondition = and(whereCondition, eq(teams.teamType, teamType));
    }

    const activeTeams = await baseQuery.where(whereCondition);
    const roundRobinStatus: RoundRobinStatus[] = [];

    for (const team of activeTeams) {
      // Obter usuários da equipe com cargas
      const teamUsers = await db
        .select({
          userId: systemUsers.id,
          displayName: systemUsers.displayName,
          isOnline: systemUsers.isOnline,
          isActive: systemUsers.isActive,
        })
        .from(systemUsers)
        .innerJoin(userTeams, eq(userTeams.userId, systemUsers.id))
        .where(
          and(
            eq(userTeams.teamId, team.id),
            eq(userTeams.isActive, true),
            eq(systemUsers.isActive, true)
          )
        );

      const usersWithLoad = [];
      
      for (const user of teamUsers) {
        // Calcular estatísticas do usuário
        const [totalAssignments] = await db
          .select({ count: count() })
          .from(conversations)
          .where(eq(conversations.assignedUserId, user.userId));

        const [activeConversations] = await db
          .select({ count: count() })
          .from(conversations)
          .where(
            and(
              eq(conversations.assignedUserId, user.userId),
              eq(conversations.status, 'open')
            )
          );

        const [lastAssignment] = await db
          .select({ assignedAt: conversations.assignedAt })
          .from(conversations)
          .where(eq(conversations.assignedUserId, user.userId))
          .orderBy(desc(conversations.assignedAt))
          .limit(1);

        const totalCount = totalAssignments.count || 0;
        const activeCount = activeConversations.count || 0;
        const lastAssignedAt = lastAssignment?.assignedAt || null;

        // Calcular score de distribuição
        const timePenalty = lastAssignedAt ? 
          Math.max(0, 10 - Math.floor((Date.now() - lastAssignedAt.getTime()) / (1000 * 60 * 60))) : 0;
        const distributionScore = (totalCount * 10) + activeCount + timePenalty;

        usersWithLoad.push({
          userId: user.userId,
          displayName: user.displayName,
          isOnline: user.isOnline || false,
          isActive: user.isActive || true,
          totalAssignments: totalCount,
          activeConversations: activeCount,
          distributionScore,
          lastAssignedAt,
          position: 0, // Será calculado após ordenação
          isNext: false
        });
      }

      // Ordenar por critério de rodízio equitativo
      usersWithLoad.sort((a, b) => {
        if (a.distributionScore !== b.distributionScore) {
          return a.distributionScore - b.distributionScore;
        }
        if (a.activeConversations !== b.activeConversations) {
          return a.activeConversations - b.activeConversations;
        }
        const aTime = a.lastAssignedAt?.getTime() || 0;
        const bTime = b.lastAssignedAt?.getTime() || 0;
        return aTime - bTime;
      });

      // Definir posições e próximo usuário
      let nextUserId = null;
      let nextUserName = null;

      usersWithLoad.forEach((user, index) => {
        user.position = index + 1;
        if (index === 0 && user.isActive) {
          user.isNext = true;
          nextUserId = user.userId;
          nextUserName = user.displayName;
        }
      });

      roundRobinStatus.push({
        teamId: team.id,
        teamName: team.name,
        teamType: team.teamType,
        users: usersWithLoad,
        nextUserId,
        nextUserName
      });
    }

    res.json({
      success: true,
      roundRobinStatus
    });

  } catch (error) {
    console.error('Erro ao obter status do rodízio:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/handoffs/round-robin/reset
 * Reseta o rodízio de uma equipe específica
 */
router.post('/reset', async (req, res) => {
  try {
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'teamId é obrigatório'
      });
    }

    // Verificar se a equipe existe
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId));

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Equipe não encontrada'
      });
    }

    // Resetar lastActivityAt de todos os usuários da equipe para equalizar
    const resetTime = new Date();
    
    await db
      .update(systemUsers)
      .set({ lastActivityAt: resetTime })
      .where(
        sql`${systemUsers.id} IN (
          SELECT ${userTeams.userId} 
          FROM ${userTeams} 
          WHERE ${userTeams.teamId} = ${teamId} 
          AND ${userTeams.isActive} = true
        )`
      );

    console.log(`🔄 Rodízio resetado para equipe ${team.name} (ID: ${teamId})`);

    res.json({
      success: true,
      message: `Rodízio da equipe ${team.name} foi resetado com sucesso`
    });

  } catch (error) {
    console.error('Erro ao resetar rodízio:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/handoffs/round-robin/assign
 * Executa atribuição manual usando rodízio equitativo
 */
router.post('/assign', async (req, res) => {
  try {
    const { conversationId, teamId } = req.body;

    if (!conversationId || !teamId) {
      return res.status(400).json({
        success: false,
        error: 'conversationId e teamId são obrigatórios'
      });
    }

    // Executar atribuição usando rodízio equitativo
    const result = await equitableRoundRobinService.assignUserToConversation(conversationId, teamId);

    if (result.success) {
      console.log(`✅ Atribuição manual via rodízio: Conversa ${conversationId} → ${result.userName}`);
    }

    res.json(result);

  } catch (error) {
    console.error('Erro na atribuição manual:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;