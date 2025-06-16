import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from "../../storage";
import { AnalyticsFilters } from './types';

export function registerConversationRoutes(app: Express) {
  // Get conversation analytics - REST: GET /api/analytics/conversations
  app.get('/api/analytics/conversations', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, groupBy, channel, userId, teamId } = req.query;
      
      const filters: AnalyticsFilters = {
        period: period || '30d',
        groupBy: groupBy || 'day'
      };
      
      if (channel && typeof channel === 'string') {
        filters.channel = channel;
      }
      
      if (userId && typeof userId === 'string') {
        filters.userId = parseInt(userId);
      }
      
      if (teamId && typeof teamId === 'string') {
        filters.teamId = parseInt(teamId);
      }
      
      const analytics = await storage.getConversationAnalytics(filters);
      
      res.json({ analytics });
    } catch (error) {
      console.error('Erro ao buscar analytics de conversas:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 