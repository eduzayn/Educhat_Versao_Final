import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from "../storage";

export function registerTeamsMembersRoutes(app: Express) {
  // Get team members - REST: GET /api/teams/:teamId/users
  app.get('/api/teams/:teamId/users', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error('Erro ao buscar membros da equipe:', error);
      res.status(500).json({ message: 'Erro ao buscar membros da equipe' });
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
      const stats = await storage.getTeamStatistics(teamId);
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
} 