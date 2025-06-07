// Movido de server/admin-routes.ts para consolidação
import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import { requirePermission, type AuthenticatedRequest } from "../../permissions";

export function registerAdminLegacyRoutes(app: Express) {
  // Admin routes consolidadas aqui
  app.get('/api/admin/audit-logs', 
    requirePermission('view_audit_logs'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const logs = await storage.getAuditLogs();
        res.json(logs);
      } catch (error) {
        console.error('Erro ao buscar logs de auditoria:', error);
        res.status(500).json({ message: 'Erro ao buscar logs de auditoria' });
      }
    }
  );

  app.get('/api/admin/system-metrics',
    requirePermission('view_system_metrics'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const metrics = await storage.getSystemMetrics();
        res.json(metrics);
      } catch (error) {
        console.error('Erro ao buscar métricas do sistema:', error);
        res.status(500).json({ message: 'Erro ao buscar métricas do sistema' });
      }
    }
  );

  app.get('/api/admin/user-sessions',
    requirePermission('manage_users'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const sessions = await storage.getActiveSessions();
        res.json(sessions);
      } catch (error) {
        console.error('Erro ao buscar sessões ativas:', error);
        res.status(500).json({ message: 'Erro ao buscar sessões ativas' });
      }
    }
  );

  app.get('/api/admin/storage-stats',
    requirePermission('view_system_stats'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const stats = await storage.getStorageStats();
        res.json(stats);
      } catch (error) {
        console.error('Erro ao buscar estatísticas de armazenamento:', error);
        res.status(500).json({ message: 'Erro ao buscar estatísticas de armazenamento' });
      }
    }
  );

  app.post('/api/admin/backup',
    requirePermission('manage_backups'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const backupResult = await storage.createBackup();
        res.json(backupResult);
      } catch (error) {
        console.error('Erro ao criar backup:', error);
        res.status(500).json({ message: 'Erro ao criar backup' });
      }
    }
  );

  app.get('/api/admin/performance-stats',
    requirePermission('view_performance_stats'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const stats = await storage.getPerformanceStats();
        res.json(stats);
      } catch (error) {
        console.error('Erro ao buscar estatísticas de performance:', error);
        res.status(500).json({ message: 'Erro ao buscar estatísticas de performance' });
      }
    }
  );

  app.get('/api/admin/error-logs',
    requirePermission('view_error_logs'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const logs = await storage.getErrorLogs();
        res.json(logs);
      } catch (error) {
        console.error('Erro ao buscar logs de erro:', error);
        res.status(500).json({ message: 'Erro ao buscar logs de erro' });
      }
    }
  );

  app.post('/api/admin/clear-cache',
    requirePermission('manage_system'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        await storage.clearCache();
        res.json({ message: 'Cache limpo com sucesso' });
      } catch (error) {
        console.error('Erro ao limpar cache:', error);
        res.status(500).json({ message: 'Erro ao limpar cache' });
      }
    }
  );

  app.get('/api/admin/database-stats',
    requirePermission('view_database_stats'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const stats = await storage.getDatabaseStats();
        res.json(stats);
      } catch (error) {
        console.error('Erro ao buscar estatísticas do banco:', error);
        res.status(500).json({ message: 'Erro ao buscar estatísticas do banco' });
      }
    }
  );

  app.post('/api/admin/optimize-database',
    requirePermission('manage_database'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const result = await storage.optimizeDatabase();
        res.json(result);
      } catch (error) {
        console.error('Erro ao otimizar banco de dados:', error);
        res.status(500).json({ message: 'Erro ao otimizar banco de dados' });
      }
    }
  );

  app.get('/api/admin/webhook-stats',
    requirePermission('view_webhook_stats'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const stats = await storage.getWebhookStats();
        res.json(stats);
      } catch (error) {
        console.error('Erro ao buscar estatísticas de webhooks:', error);
        res.status(500).json({ message: 'Erro ao buscar estatísticas de webhooks' });
      }
    }
  );

  app.post('/api/admin/test-webhook',
    requirePermission('manage_webhooks'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const result = await storage.testWebhookConnection();
        res.json(result);
      } catch (error) {
        console.error('Erro ao testar webhook:', error);
        res.status(500).json({ message: 'Erro ao testar webhook' });
      }
    }
  );

  app.get('/api/admin/integration-health',
    requirePermission('view_integration_health'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const health = await storage.getIntegrationHealth();
        res.json(health);
      } catch (error) {
        console.error('Erro ao verificar saúde das integrações:', error);
        res.status(500).json({ message: 'Erro ao verificar saúde das integrações' });
      }
    }
  );
}