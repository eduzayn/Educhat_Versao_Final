import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from "../../storage/index";
import { AnalyticsFilters } from './types';

export function registerDealRoutes(app: Express) {
  // Get deal conversion analytics - REST: GET /api/analytics/deals/conversion
  app.get('/api/analytics/deals/conversion', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, teamType, userId, teamId, stage } = req.query;
      
      const filters: AnalyticsFilters = {
        period: String(period || '30d')
      };
      
      if (teamType && typeof teamType === 'string') {
        filters.teamType = teamType;
      }
      
      if (userId && typeof userId === 'string') {
        filters.userId = parseInt(userId);
      }
      
      if (teamId && typeof teamId === 'string') {
        filters.teamId = parseInt(teamId);
      }
      
      if (stage && typeof stage === 'string') {
        filters.stage = stage;
      }
      
      const analytics = await storage.getDealConversionAnalytics(filters);
      
      res.json({ analytics });
    } catch (error) {
      console.error('Erro ao buscar analytics de conversão de negócios:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Get sales funnel analytics - REST: GET /api/analytics/sales-funnel
  app.get('/api/analytics/sales-funnel', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, teamType, userId, teamId } = req.query;
      
      const filters: AnalyticsFilters = {
        period: String(period || '30d')
      };
      
      if (teamType && typeof teamType === 'string') {
        filters.teamType = teamType;
      }
      
      if (userId && typeof userId === 'string') {
        filters.userId = parseInt(userId);
      }
      
      if (teamId && typeof teamId === 'string') {
        filters.teamId = parseInt(teamId);
      }
      
      const analytics = await storage.getSalesFunnelAnalytics(filters);
      
      res.json({ analytics });
    } catch (error) {
      console.error('Erro ao buscar analytics do funil de vendas:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 