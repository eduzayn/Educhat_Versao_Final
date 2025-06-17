import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissionsRefactored';
import { storage } from "../../storage";
import { AnalyticsFilters } from './types';

export function registerTeamRoutes(app: Express) {
  // Get team performance analytics - REST: GET /api/analytics/teams
  app.get('/api/analytics/teams', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, metric, teamId } = req.query;
      
      const filters: AnalyticsFilters = {
        period: String(period || '30d'),
        metric: String(metric || 'all')
      };
      
      if (teamId && typeof teamId === 'string') {
        filters.teamId = parseInt(teamId);
      }
      
      const analytics = await storage.getTeamPerformanceAnalytics(filters);
      
      res.json({ analytics });
    } catch (error) {
      console.error('Erro ao buscar analytics de equipes:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 