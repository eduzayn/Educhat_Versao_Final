import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from "../../storage";

export function registerUserTeamsMembersRoutes(app: Express) {
  // Get team members - REST: GET /api/user-teams/:teamId
  app.get('/api/user-teams/:teamId', requirePermission('teams:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error('Erro ao buscar membros da equipe:', error);
      res.status(500).json({ message: 'Erro ao buscar membros da equipe' });
    }
  });

  // Update team member role - REST: PATCH /api/user-teams
  app.patch('/api/user-teams', requirePermission('teams:manage'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, teamId, role } = req.body;
      
      if (!userId || !teamId || !role) {
        return res.status(400).json({ message: 'userId, teamId e role são obrigatórios' });
      }

      const updatedMember = await storage.updateTeamMemberRole(parseInt(userId), parseInt(teamId), role);
      console.log(`🔄 Role do usuário ${userId} na equipe ${teamId} atualizado para: ${role}`);
      res.json({ 
        success: true, 
        message: 'Role do membro atualizado com sucesso',
        updatedMember 
      });
    } catch (error) {
      console.error('Erro ao atualizar role do membro da equipe:', error);
      res.status(500).json({ message: 'Erro ao atualizar role do membro da equipe' });
    }
  });
} 