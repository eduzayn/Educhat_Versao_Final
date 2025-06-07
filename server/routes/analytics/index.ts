import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../permissions';
import { requirePermission } from '../../permissions';
import { storage } from '../../storage';

export function registerAnalyticsRoutes(app: Express) {
  
  // Get analytics dashboard data - REST: GET /api/analytics/dashboard
  app.get('/api/analytics/dashboard', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { startDate, endDate, userId, teamId, macrosetor } = req.query;
      
      const filters: any = {};
      
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
      
      if (macrosetor && typeof macrosetor === 'string') {
        filters.macrosetor = macrosetor;
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

  // Get conversation analytics - REST: GET /api/analytics/conversations
  app.get('/api/analytics/conversations', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, groupBy, channel, userId, teamId } = req.query;
      
      const filters: any = {
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

  // Get message analytics - REST: GET /api/analytics/messages
  app.get('/api/analytics/messages', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, messageType, channel, userId } = req.query;
      
      const filters: any = {
        period: period || '30d'
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

  // Get response time analytics - REST: GET /api/analytics/response-times
  app.get('/api/analytics/response-times', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, userId, teamId, channel } = req.query;
      
      const filters: any = {
        period: period || '30d'
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

  // Get channel performance analytics - REST: GET /api/analytics/channels
  app.get('/api/analytics/channels', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, metric } = req.query;
      
      const filters: any = {
        period: period || '30d',
        metric: metric || 'all'
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

  // Get user performance analytics - REST: GET /api/analytics/users
  app.get('/api/analytics/users', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, metric, teamId, userId } = req.query;
      
      const filters: any = {
        period: period || '30d',
        metric: metric || 'all'
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

  // Get team performance analytics - REST: GET /api/analytics/teams
  app.get('/api/analytics/teams', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, metric, teamId } = req.query;
      
      const filters: any = {
        period: period || '30d',
        metric: metric || 'all'
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

  // Get deal conversion analytics - REST: GET /api/analytics/deals/conversion
  app.get('/api/analytics/deals/conversion', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period, macrosetor, userId, teamId, stage } = req.query;
      
      const filters: any = {
        period: period || '30d'
      };
      
      if (macrosetor && typeof macrosetor === 'string') {
        filters.macrosetor = macrosetor;
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
      const { period, macrosetor, userId, teamId } = req.query;
      
      const filters: any = {
        period: period || '30d'
      };
      
      if (macrosetor && typeof macrosetor === 'string') {
        filters.macrosetor = macrosetor;
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

  // Generate analytics report - REST: POST /api/analytics/reports
  app.post('/api/analytics/reports', requirePermission('analytics:export'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        reportType,
        period,
        format,
        filters,
        includeCharts,
        recipients
      } = req.body;
      
      if (!reportType) {
        return res.status(400).json({ error: 'Tipo de relatório é obrigatório' });
      }
      
      const reportData = {
        reportType,
        period: period || '30d',
        format: format || 'pdf',
        filters: filters || {},
        includeCharts: includeCharts !== false,
        requestedBy: req.user?.id,
        requestedAt: new Date()
      };
      
      // Gerar relatório (implementação depende do tipo)
      const report = await storage.generateAnalyticsReport(reportData);
      
      // Se tem destinatários, enviar por email
      if (recipients && Array.isArray(recipients) && recipients.length > 0) {
        await storage.sendAnalyticsReport(report.id, recipients);
      }
      
      res.status(201).json({ 
        report: {
          id: report.id,
          status: 'generated',
          downloadUrl: report.downloadUrl
        }
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de analytics:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Get custom analytics query - REST: POST /api/analytics/query
  app.post('/api/analytics/query', requirePermission('analytics:advanced'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { query, parameters } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query é obrigatória' });
      }
      
      // Validar e executar query customizada (com restrições de segurança)
      const results = await storage.executeCustomAnalyticsQuery(query, parameters);
      
      res.json({ results });
    } catch (error) {
      console.error('Erro ao executar query customizada:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Get real-time analytics - REST: GET /api/analytics/realtime
  app.get('/api/analytics/realtime', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const realtimeData = await storage.getRealtimeAnalytics();
      
      res.json({ data: realtimeData });
    } catch (error) {
      console.error('Erro ao buscar analytics em tempo real:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Get analytics trends - REST: GET /api/analytics/trends
  app.get('/api/analytics/trends', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { metric, period, compareWith } = req.query;
      
      if (!metric) {
        return res.status(400).json({ error: 'Métrica é obrigatória' });
      }
      
      const filters = {
        metric: metric as string,
        period: (period as string) || '30d',
        compareWith: (compareWith as string) || 'previous_period'
      };
      
      const trends = await storage.getAnalyticsTrends(filters);
      
      res.json({ trends });
    } catch (error) {
      console.error('Erro ao buscar tendências de analytics:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Get analytics alerts - REST: GET /api/analytics/alerts
  app.get('/api/analytics/alerts', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { active, type, severity } = req.query;
      
      const filters: any = {};
      
      if (active && typeof active === 'string') {
        filters.active = active === 'true';
      }
      
      if (type && typeof type === 'string') {
        filters.type = type;
      }
      
      if (severity && typeof severity === 'string') {
        filters.severity = severity;
      }
      
      const alerts = await storage.getAnalyticsAlerts(filters);
      
      res.json({ alerts });
    } catch (error) {
      console.error('Erro ao buscar alertas de analytics:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Create analytics alert - REST: POST /api/analytics/alerts
  app.post('/api/analytics/alerts', requirePermission('analytics:manage'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const alertData = {
        ...req.body,
        createdBy: req.user?.id,
        createdAt: new Date()
      };
      
      const alert = await storage.createAnalyticsAlert(alertData);
      
      res.status(201).json({ alert });
    } catch (error) {
      console.error('Erro ao criar alerta de analytics:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Update analytics alert - REST: PATCH /api/analytics/alerts/:id
  app.patch('/api/analytics/alerts/:id', requirePermission('analytics:manage'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const alertId = parseInt(req.params.id);
      
      if (isNaN(alertId)) {
        return res.status(400).json({ error: 'ID do alerta inválido' });
      }
      
      const updateData = {
        ...req.body,
        updatedBy: req.user?.id,
        updatedAt: new Date()
      };
      
      const alert = await storage.updateAnalyticsAlert(alertId, updateData);
      
      if (!alert) {
        return res.status(404).json({ error: 'Alerta não encontrado' });
      }
      
      res.json({ alert });
    } catch (error) {
      console.error('Erro ao atualizar alerta de analytics:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Delete analytics alert - REST: DELETE /api/analytics/alerts/:id
  app.delete('/api/analytics/alerts/:id', requirePermission('analytics:manage'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const alertId = parseInt(req.params.id);
      
      if (isNaN(alertId)) {
        return res.status(400).json({ error: 'ID do alerta inválido' });
      }
      
      await storage.deleteAnalyticsAlert(alertId);
      
      res.json({ success: true, message: 'Alerta deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar alerta de analytics:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
}