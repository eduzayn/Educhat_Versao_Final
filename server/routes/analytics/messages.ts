import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from "../../storage/index";
import { AnalyticsFilters } from './types';

export function registerMessageRoutes(app: Express) {
  // Get message analytics - REST: GET /api/analytics/messages
  app.get('/api/analytics/messages', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, messageType, channel, userId } = req.query;
      
      const filters: AnalyticsFilters = {
        period: String(period || '30d')
      };
      
      if (messageType && typeof messageType === 'string') {
        filters.messageType = messageType;
      }
      
      if (channel && typeof channel === 'string') {
        filters.channel = channel;
      }
      
      if (userId && typeof userId === 'string') {
        filters.userId = parseInt(userId);
      }
      
      const analytics = await storage.getMessageAnalytics(filters);
      
      res.json({ analytics });
    } catch (error) {
      console.error('Erro ao buscar analytics de mensagens:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 