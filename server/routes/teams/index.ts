import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../admin/permissions';
import { storage } from '../../core/storage';

export function registerTeamsRoutes(app: Express) {
  
  // Get all teams - REST: GET /api/teams
  app.get('/api/teams', requirePermission('teams:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error('Erro ao buscar equipes:', error);
      res.status(500).json({ message: 'Erro ao buscar equipes' });
    }
  });

  // Create new team - REST: POST /api/teams
  app.post('/api/teams', requirePermission('teams:create'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teamData = req.body;
      const newTeam = await storage.createTeam(teamData);
      console.log(`🎯 Nova equipe criada: ${newTeam.name} - Macrosetor: ${newTeam.macrosetor}`);
      res.status(201).json(newTeam);
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
      res.status(500).json({ message: 'Erro ao criar equipe' });
    }
  });

  // Update existing team - REST: PUT /api/teams/:id
  app.put('/api/teams/:id', requirePermission('teams:update'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const teamData = req.body;
      const updatedTeam = await storage.updateTeam(id, teamData);
      console.log(`✏️ Equipe atualizada: ${updatedTeam.name}`);
      res.json(updatedTeam);
    } catch (error) {
      console.error('Erro ao atualizar equipe:', error);
      res.status(500).json({ message: 'Erro ao atualizar equipe' });
    }
  });

  // Delete team - REST: DELETE /api/teams/:id
  app.delete('/api/teams/:id', requirePermission('teams:delete'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTeam(id);
      console.log(`🗑️ Equipe deletada: ID ${id}`);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar equipe:', error);
      res.status(500).json({ message: 'Erro ao deletar equipe' });
    }
  });

  // Get teams by macrosetor - REST: GET /api/teams/macrosetor/:macrosetor
  app.get('/api/teams/macrosetor/:macrosetor', requirePermission('teams:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { macrosetor } = req.params;
      const team = await storage.getTeamByMacrosetor(macrosetor);
      if (team) {
        res.json(team);
      } else {
        res.status(404).json({ message: `Nenhuma equipe encontrada para o macrosetor: ${macrosetor}` });
      }
    } catch (error) {
      console.error('Erro ao buscar equipe por macrosetor:', error);
      res.status(500).json({ message: 'Erro ao buscar equipe por macrosetor' });
    }
  });

  // Get user teams - REST: GET /api/users/:userId/teams
  app.get('/api/users/:userId/teams', requirePermission('teams:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const userTeams = await storage.getUserTeams(userId);
      res.json(userTeams);
    } catch (error) {
      console.error('Erro ao buscar equipes do usuário:', error);
      res.status(500).json({ message: 'Erro ao buscar equipes do usuário' });
    }
  });

  // Add member to team - REST: POST /api/teams/:teamId/members
  app.post('/api/teams/:teamId/members', requirePermission('teams:manage'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { userId, roleInTeam } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'userId é obrigatório' });
      }

      const userTeam = await storage.addUserToTeam({
        userId: parseInt(userId),
        teamId: teamId,
        role: roleInTeam || 'member',
        isActive: true
      });

      console.log(`👤 Usuário ${userId} adicionado à equipe ${teamId} como ${roleInTeam || 'member'}`);
      res.status(201).json(userTeam);
    } catch (error) {
      console.error('Erro ao adicionar usuário à equipe:', error);
      res.status(500).json({ message: 'Erro ao adicionar usuário à equipe' });
    }
  });

  // Remove member from team - REST: DELETE /api/teams/:teamId/members/:userId
  app.delete('/api/teams/:teamId/members/:userId', requirePermission('teams:manage'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);
      
      await storage.removeUserFromTeam(userId, teamId);
      console.log(`❌ Usuário ${userId} removido da equipe ${teamId}`);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao remover usuário da equipe:', error);
      res.status(500).json({ message: 'Erro ao remover usuário da equipe' });
    }
  });

  // Update team member role - REST: PATCH /api/teams/:teamId/members/:userId
  app.patch('/api/teams/:teamId/members/:userId', requirePermission('teams:manage'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);
      const { role } = req.body;
      
      if (!role) {
        return res.status(400).json({ message: 'Role é obrigatório' });
      }

      const updatedMember = await storage.updateTeamMemberRole(userId, teamId, role);
      console.log(`🔄 Role do usuário ${userId} na equipe ${teamId} atualizado para: ${role}`);
      res.json(updatedMember);
    } catch (error) {
      console.error('Erro ao atualizar role do membro da equipe:', error);
      res.status(500).json({ message: 'Erro ao atualizar role do membro da equipe' });
    }
  });

  // Get team members - REST: GET /api/teams/:teamId/members
  app.get('/api/teams/:teamId/members', requirePermission('teams:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error('Erro ao buscar membros da equipe:', error);
      res.status(500).json({ message: 'Erro ao buscar membros da equipe' });
    }
  });

  // Get team statistics - REST: GET /api/teams/:teamId/stats
  app.get('/api/teams/:teamId/stats', requirePermission('teams:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { period } = req.query;
      
      const stats = await storage.getTeamStatistics(teamId, period as string);
      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas da equipe:', error);
      res.status(500).json({ message: 'Erro ao buscar estatísticas da equipe' });
    }
  });

  // Get available users for team assignment - REST: GET /api/teams/:teamId/available-users
  app.get('/api/teams/:teamId/available-users', requirePermission('teams:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const availableUser = await storage.getAvailableUserFromTeam(teamId);
      
      if (availableUser) {
        res.json({ user: availableUser, available: true });
      } else {
        res.json({ user: null, available: false, message: 'Nenhum usuário disponível na equipe' });
      }
    } catch (error) {
      console.error('Erro ao buscar usuário disponível da equipe:', error);
      res.status(500).json({ message: 'Erro ao buscar usuário disponível da equipe' });
    }
  });

  // Assign conversation to team - REST: POST /api/teams/:teamId/assign-conversation
  app.post('/api/teams/:teamId/assign-conversation', requirePermission('teams:manage'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { conversationId, method } = req.body;
      
      if (!conversationId) {
        return res.status(400).json({ message: 'conversationId é obrigatório' });
      }

      await storage.assignConversationToTeam(conversationId, teamId, method || 'manual');
      
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

      await storage.assignConversationToUser(conversationId, userId, method || 'manual');
      
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