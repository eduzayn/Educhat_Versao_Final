import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from "../../storage";
import { AnalyticsReportRequest } from './types';

export function registerReportRoutes(app: Express) {
  // Generate analytics report - REST: POST /api/analytics/reports
  app.post('/api/analytics/reports', requirePermission('analytics:export'), async (req: AnalyticsReportRequest, res: Response) => {
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
        await storage.sendAnalyticsReport(report.reportId, recipients);
      }
      
      res.status(201).json({ 
        report: {
          id: report.reportId,
          status: 'generated',
          downloadUrl: `/api/analytics/reports/${report.reportId}/download`
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
} 