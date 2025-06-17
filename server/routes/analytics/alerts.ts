import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from "../storage";
import { AnalyticsFilters, AnalyticsAlertRequest } from './types';

export function registerAlertRoutes(app: Express) {
  // Get analytics alerts - REST: GET /api/analytics/alerts
  app.get('/api/analytics/alerts', requirePermission('analytics:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { active, type, severity } = req.query;
      
      const filters: AnalyticsFilters = {};
      
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
  app.post('/api/analytics/alerts', requirePermission('analytics:manage'), async (req: AnalyticsAlertRequest, res: Response) => {
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