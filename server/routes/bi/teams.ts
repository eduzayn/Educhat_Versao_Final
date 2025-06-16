import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage";
import { BITeamStats } from './types';
import { Team } from '../../types/team';

export function registerTeamRoutes(app: Express) {
  // Performance de Equipes - REST: GET /api/bi/teams
  app.get('/api/bi/teams', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const teams = await storage.getTeams();
      const conversations = await storage.getConversations(1000, 0);
      const users = await storage.getUsers();

      // Filtrar por período
      const periodConversations = conversations.filter(c => 
        c.createdAt && new Date(c.createdAt) >= startDate
      );

      // Dados por equipe
      const teamStats: BITeamStats[] = await Promise.all(teams.map(async (team: Team) => {
        const teamUsers = await storage.getUserTeams(team.id);
        const teamConversations = periodConversations.filter(c => c.assignedTeamId === team.id);
        
        // Top performers da equipe
        const topPerformers = teamUsers.slice(0, 3).map(user => ({
          name: `Usuário ${user.id}`,
          score: Math.random() * 40 + 60 // Simulado
        }));

        return {
          id: team.id,
          name: team.name,
          teamType: team.teamType,
          totalConversations: teamConversations.length,
          activeMembers: teamUsers.length,
          avgResponseTime: Math.random() * 3 + 1, // Simulado
          satisfaction: Math.random() * 2 + 3, // Simulado
          efficiency: Math.random() * 30 + 70, // Simulado
          topPerformers
        };
      }));

      res.json({
        teams: teamStats.sort((a, b) => b.efficiency - a.efficiency)
      });
    } catch (error) {
      console.error('Erro ao buscar dados de equipes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
} 