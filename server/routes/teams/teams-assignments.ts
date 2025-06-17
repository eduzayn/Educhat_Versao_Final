import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from "../storage";
import { conversationAssignmentService } from '../../services/conversationAssignmentService';

export function registerTeamsAssignmentsRoutes(app: Express) {
  // Assign conversation to team - REST: POST /api/teams/:teamId/assign-conversation
  app.post('/api/teams/:teamId/assign-conversation', requirePermission('teams:manage'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { conversationId, method } = req.body;
      
      if (!conversationId) {
        return res.status(400).json({ message: 'conversationId é obrigatório' });
      }

      await conversationAssignmentService.assignConversationToTeam(conversationId, teamId);
      
      // Broadcast assignment notification
      const { broadcastToAll } = await import('../realtime');
      broadcastToAll({
        type: 'conversation_assigned_to_team',
        conversationId,
        teamId,
        method: method || 'manual',
        assignedBy: req.user?.displayName || req.user?.username
      });

      console.log(`📋 Conversa ${conversationId} atribuída à equipe ${teamId}`);
      res.json({ success: true, message: 'Conversa atribuída à equipe com sucesso' });
    } catch (error) {
      console.error('Erro ao atribuir conversa à equipe:', error);
      res.status(500).json({ message: 'Erro ao atribuir conversa à equipe' });
    }
  });

  // Assign conversation to team member - REST: POST /api/teams/:teamId/assign-user
  app.post('/api/teams/:teamId/assign-user', requirePermission('teams:manage'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { conversationId, userId, method } = req.body;
      
      if (!conversationId || !userId) {
        return res.status(400).json({ message: 'conversationId e userId são obrigatórios' });
      }

      await conversationAssignmentService.assignConversationToUser(conversationId, userId);
      
      // Broadcast assignment notification
      const { broadcastToAll } = await import('../realtime');
      broadcastToAll({
        type: 'conversation_assigned_to_user',
        conversationId,
        userId,
        teamId,
        method: method || 'manual',
        assignedBy: req.user?.displayName || req.user?.username
      });

      console.log(`👤 Conversa ${conversationId} atribuída ao usuário ${userId} da equipe ${teamId}`);
      res.json({ success: true, message: 'Conversa atribuída ao usuário com sucesso' });
    } catch (error) {
      console.error('Erro ao atribuir conversa ao usuário:', error);
      res.status(500).json({ message: 'Erro ao atribuir conversa ao usuário' });
    }
  });

  // Get team workload - REST: GET /api/teams/:teamId/workload
  app.get('/api/teams/:teamId/workload', requirePermission('teams:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const workload = await storage.getTeamWorkload(teamId);
      res.json(workload);
    } catch (error) {
      console.error('Erro ao buscar carga de trabalho da equipe:', error);
      res.status(500).json({ message: 'Erro ao buscar carga de trabalho da equipe' });
    }
  });

  // Transfer conversation between teams - REST: POST /api/teams/transfer-conversation
  app.post('/api/teams/transfer-conversation', requirePermission('teams:manage'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { conversationId, fromTeamId, toTeamId, reason } = req.body;
      
      if (!conversationId || !toTeamId) {
        return res.status(400).json({ message: 'conversationId e toTeamId são obrigatórios' });
      }

      await storage.transferConversationBetweenTeams(conversationId, fromTeamId, toTeamId, reason);
      
      // Broadcast transfer notification
      const { broadcastToAll } = await import('../realtime');
      broadcastToAll({
        type: 'conversation_transferred',
        conversationId,
        fromTeamId,
        toTeamId,
        reason,
        transferredBy: req.user?.displayName || req.user?.username
      });

      console.log(`🔄 Conversa ${conversationId} transferida da equipe ${fromTeamId} para ${toTeamId}`);
      res.json({ success: true, message: 'Conversa transferida com sucesso' });
    } catch (error) {
      console.error('Erro ao transferir conversa entre equipes:', error);
      res.status(500).json({ message: 'Erro ao transferir conversa entre equipes' });
    }
  });
} 