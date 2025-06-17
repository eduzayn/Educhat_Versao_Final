import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissionsRefactored';
import { storage } from "../../storage/index";
import { AnalyticsFilters } from './types';

export function registerUserRoutes(app: Express) {
  // Get user performance analytics - REST: GET /api/analytics/users
  app.get('/api/analytics/users', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, metric, teamId, userId } = req.query;
      
      const filters: AnalyticsFilters = {
        period: String(period || '30d'),
        metric: String(metric || 'all')
      };
      
      if (teamId && typeof teamId === 'string') {
        filters.teamId = parseInt(teamId);
      }
      
      if (userId && typeof userId === 'string') {
        filters.userId = parseInt(userId);
      }
      
      const analytics = await storage.getUserPerformanceAnalytics(filters);
      
      res.json({ analytics });
    } catch (error) {
      console.error('Erro ao buscar analytics de usuários:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 