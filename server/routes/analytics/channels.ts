import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from "../../storage/index";
import { AnalyticsFilters } from './types';

export function registerChannelRoutes(app: Express) {
  // Get channel performance analytics - REST: GET /api/analytics/channels
  app.get('/api/analytics/channels', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, metric } = req.query;
      
      const filters: AnalyticsFilters = {
        period: String(period || '30d'),
        metric: String(metric || 'all')
      };
      
      const analytics = await storage.getChannelAnalytics(filters);
      
      res.json({ analytics });
    } catch (error) {
      console.error('Erro ao buscar analytics de canais:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 