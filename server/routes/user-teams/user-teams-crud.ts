import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from "../storage";

export function registerUserTeamsCrudRoutes(app: Express) {
  // Add user to team - REST: POST /api/user-teams
  app.post('/api/user-teams', requirePermission('teams:manage'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, teamId, role } = req.body;
      
      if (!userId || !teamId) {
        return res.status(400).json({ message: 'userId e teamId são obrigatórios' });
      }

      // Verificar se o usuário já está na equipe usando getUserTeams
      const userTeams = await storage.getUserTeams(parseInt(userId));
      const isAlreadyMember = userTeams.some(team => team.id === parseInt(teamId));
      
      if (isAlreadyMember) {
        return res.status(400).json({ message: 'Usuário já é membro desta equipe' });
      }

      const userTeam = await storage.addUserToTeam({
        userId: parseInt(userId),
        teamId: parseInt(teamId),
        role: role || 'member',
        isActive: true
      });

      console.log(`👤 Usuário ${userId} adicionado à equipe ${teamId} como ${role || 'member'}`);
      res.status(201).json({ 
        success: true, 
        message: 'Usuário adicionado à equipe com sucesso',
        userTeam 
      });
    } catch (error: any) {
      console.error('Erro ao adicionar usuário à equipe:', error);
      res.status(500).json({ message: 'Erro ao adicionar usuário à equipe', error: error.message });
    }
  });

  // Remove user from team - REST: DELETE /api/user-teams
  app.delete('/api/user-teams', requirePermission('teams:manage'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, teamId } = req.body;
      
      if (!userId || !teamId) {
        return res.status(400).json({ message: 'userId e teamId são obrigatórios' });
      }
      
      await storage.removeUserFromTeam(parseInt(userId), parseInt(teamId));
      console.log(`❌ Usuário ${userId} removido da equipe ${teamId}`);
      res.json({ 
        success: true, 
        message: 'Usuário removido da equipe com sucesso' 
      });
    } catch (error: any) {
      console.error('Erro ao remover usuário da equipe:', error);
      res.status(500).json({ message: 'Erro ao remover usuário da equipe', error: error.message });
    }
  });
} 