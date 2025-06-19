import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissionsRefactored';
import { storage } from "../../storage/index";
import { funnelService } from '../../services/funnelService';

export function registerTeamsCrudRoutes(app: Express) {
  // Get all teams - REST: GET /api/teams
  app.get('/api/teams', async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Verificação básica de autenticação - se não há usuário na sessão, retornar array vazio
      if (!req.user) {
        console.warn('⚠️  Tentativa de acesso não autenticado à rota /api/teams');
        return res.json([]);
      }
      
      const teams = await storage.getTeams();
      res.json(teams || []);
    } catch (error) {
      console.error('Erro ao buscar equipes:', error);
      // Retornar array vazio em caso de erro para não quebrar o frontend
      res.json([]);
    }
  });

  // Create new team - REST: POST /api/teams
  app.post('/api/teams', requirePermission('teams:create'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const teamData = req.body;
      const newTeam = await storage.createTeam(teamData);
      console.log(`🎯 Nova equipe criada: ${newTeam.name} - Tipo: ${newTeam.teamType}`);
      
      // Criar automaticamente canal de chat interno para a nova equipe
      try {
        const createTeamChannel = (global as any).createTeamChannel;
        if (typeof createTeamChannel === 'function') {
          await createTeamChannel(newTeam.id, newTeam.name, newTeam.description);
          console.log(`📢 Canal de chat criado automaticamente para equipe: ${newTeam.name}`);
        }
      } catch (channelError) {
        console.error('❌ Erro ao criar canal automático:', channelError);
        // Não falhar a criação da equipe se o canal falhar
      }
      
      // Criar funil automaticamente para a nova equipe (consolidado de utilities)
      try {
        await funnelService.createFunnelForTeam(newTeam.id);
        console.log(`✅ Funil criado automaticamente para nova equipe: ${newTeam.name} (ID: ${newTeam.id})`);
      } catch (funnelError) {
        console.warn(`⚠️ Erro ao criar funil automático para equipe ${newTeam.name}:`, funnelError);
        // Não falhar a criação da equipe se houver erro no funil
      }
      
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

  // Get teams by type - REST: GET /api/teams/type/:teamType
  app.get('/api/teams/type/:teamType', requirePermission('teams:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { teamType } = req.params;
      const team = await storage.getTeamByTeamType(teamType);
      if (team) {
        res.json(team);
      } else {
        res.status(404).json({ message: `Nenhuma equipe encontrada para o tipo: ${teamType}` });
      }
    } catch (error) {
      console.error('Erro ao buscar equipe por tipo:', error);
      res.status(500).json({ message: 'Erro ao buscar equipe por tipo' });
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
} 