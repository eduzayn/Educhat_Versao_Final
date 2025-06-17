import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from "../../storage/index";
import { AnalyticsFilters } from './types';

export function registerResponseTimeRoutes(app: Express) {
  // Get response time analytics - REST: GET /api/analytics/response-times
  app.get('/api/analytics/response-times', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, userId, teamId, channel } = req.query;
      
      const filters: AnalyticsFilters = {
        period: String(period || '30d')
      };
      
      if (userId && typeof userId === 'string') {
        filters.userId = parseInt(userId);
      }
      
      if (teamId && typeof teamId === 'string') {
        filters.teamId = parseInt(teamId);
      }
      
      if (channel && typeof channel === 'string') {
        filters.channel = channel;
      }
      
      const analytics = await storage.getResponseTimeAnalytics(filters);
      
      res.json({ analytics });
    } catch (error) {
      console.error('Erro ao buscar analytics de tempo de resposta:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 