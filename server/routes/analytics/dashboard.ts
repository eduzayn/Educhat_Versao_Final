import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from "../storage";
import { AnalyticsFilters } from './types';

export function registerDashboardRoutes(app: Express) {
  // Get analytics dashboard data - REST: GET /api/analytics/dashboard
  app.get('/api/analytics/dashboard', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { startDate, endDate, userId, teamId, teamType } = req.query;
      
      const filters: AnalyticsFilters = {};
      
      if (startDate && typeof startDate === 'string') {
        filters.startDate = new Date(startDate);
      }
      
      if (endDate && typeof endDate === 'string') {
        filters.endDate = new Date(endDate);
      }
      
      if (userId && typeof userId === 'string') {
        filters.userId = parseInt(userId);
      }
      
      if (teamId && typeof teamId === 'string') {
        filters.teamId = parseInt(teamId);
      }
      
      if (teamType && typeof teamType === 'string') {
        filters.teamType = teamType;
      }
      
      // Buscar dados analíticos
      const [
        conversationStats,
        messageStats,
        dealStats,
        responseTimeStats,
        channelStats,
        userPerformance,
        teamPerformance
      ] = await Promise.all([
        storage.getConversationAnalytics(filters),
        storage.getMessageAnalytics(filters),
        storage.getDealAnalytics(filters),
        storage.getResponseTimeAnalytics(filters),
        storage.getChannelAnalytics(filters),
        storage.getUserPerformanceAnalytics(filters),
        storage.getTeamPerformanceAnalytics(filters)
      ]);
      
      const dashboardData = {
        conversations: conversationStats,
        messages: messageStats,
        deals: dealStats,
        responseTimes: responseTimeStats,
        channels: channelStats,
        userPerformance,
        teamPerformance,
        generatedAt: new Date().toISOString()
      };
      
      res.json({ data: dashboardData });
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 