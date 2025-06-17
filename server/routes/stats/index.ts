import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission, updateLastActivity } from '../../core/permissionsRefactored';
import { unifiedStatsService, StatsFilters } from '../../services/unifiedStatsService';

export function registerUnifiedStatsRoutes(app: Express) {
  // Rota unificada de estatísticas - REST: GET /api/stats
  app.get('/api/stats', 
    updateLastActivity(),
    requirePermission('estatisticas:ver'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { 
          startDate, 
          endDate, 
          userId, 
          teamId, 
          teamType, 
          module 
        } = req.query;
        
        // Construir filtros
        const filters: StatsFilters = {};
        
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
        
        // Obter estatísticas unificadas
        const stats = await unifiedStatsService.getUnifiedStats(
          filters, 
          module as string
        );
        
        res.json(stats);
      } catch (error) {
        console.error('Erro ao buscar estatísticas unificadas:', error);
        res.status(500).json({ 
          error: 'Erro interno do servidor',
          message: 'Falha ao obter estatísticas'
        });
      }
    }
  );

  // Proxy routes para compatibilidade com rotas existentes
  
  // Proxy para admin stats
  app.get('/api/admin/stats', 
    updateLastActivity(),
    requirePermission('estatisticas:ver'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const stats = await unifiedStatsService.getUnifiedStats({}, 'admin');
        res.json({
          ...stats.overview,
          ...stats.performance,
          moduleSpecific: stats.moduleSpecific
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas admin:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  );

  // Proxy para analytics dashboard
  app.get('/api/analytics/dashboard', 
    updateLastActivity(),
    requirePermission('analytics:read'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { startDate, endDate, userId, teamId, teamType } = req.query;
        
        const filters: StatsFilters = {};
        if (startDate) filters.startDate = new Date(startDate as string);
        if (endDate) filters.endDate = new Date(endDate as string);
        if (userId) filters.userId = parseInt(userId as string);
        if (teamId) filters.teamId = parseInt(teamId as string);
        if (teamType) filters.teamType = teamType as string;
        
        const stats = await unifiedStatsService.getUnifiedStats(filters, 'analytics');
        res.json(stats);
      } catch (error) {
        console.error('Erro ao buscar analytics dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  );

  // Proxy para BI dashboard
  app.get('/api/bi/dashboard', 
    updateLastActivity(),
    requirePermission('bi:read'), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const stats = await unifiedStatsService.getUnifiedStats({}, 'bi');
        res.json(stats);
      } catch (error) {
        console.error('Erro ao buscar BI dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  );

  // Proxy para dashboard metrics
  app.get('/api/dashboard/metrics', 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const stats = await unifiedStatsService.getUnifiedStats({}, 'dashboard');
        res.json({
          activeConversations: stats.overview.totalConversations,
          newContacts: stats.overview.totalContacts,
          dealsInProgress: stats.overview.totalDeals,
          avgResponseTime: stats.performance.avgResponseTime,
          ...stats.moduleSpecific?.quickMetrics
        });
      } catch (error) {
        console.error('Erro ao buscar métricas dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  );
}