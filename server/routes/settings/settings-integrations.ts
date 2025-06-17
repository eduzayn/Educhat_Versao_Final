import { Express, Response } from 'express';
import { storage } from "../storage";
import { z } from "zod";
import { insertManychatIntegrationSchema } from "@shared/schema";
import { facebookRoutes } from '../integrations/facebook';

// Schema para teste de conexão Manychat
const manychatTestSchema = z.object({
  apiKey: z.string().min(1, "API Key é obrigatória")
});

export function registerIntegrationsRoutes(app: Express) {
  // Get all integrations overview
  app.get('/api/settings/integrations', async (req, res) => {
    try {
      const [manychatIntegrations] = await Promise.all([
        storage.manychat.getIntegrations()
      ]);
      
      res.json({
        manychat: manychatIntegrations,
        facebook: [],
        totalActive: manychatIntegrations.filter((i: any) => i.isActive).length
      });
    } catch (error) {
      console.error('Error fetching integrations overview:', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  });

  // ==================== MANYCHAT INTEGRATION ====================
  
  // Get all Manychat integrations
  app.get('/api/settings/integrations/manychat', async (req, res) => {
    try {
      const integrations = await storage.manychat.getIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error('Error fetching Manychat integrations:', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  });

  // Get specific Manychat integration
  app.get('/api/settings/integrations/manychat/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid integration ID' });
      }

      const integration = await storage.manychat.getIntegration(id);
      if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      res.json(integration);
    } catch (error) {
      console.error('Error fetching Manychat integration:', error);
      res.status(500).json({ error: 'Failed to fetch integration' });
    }
  });

  // Create new Manychat integration
  app.post('/api/settings/integrations/manychat', async (req, res) => {
    try {
      const validationResult = insertManychatIntegrationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid data', 
          details: validationResult.error.errors 
        });
      }

      const integration = await storage.manychat.createIntegration(validationResult.data);
      
      console.log(`✅ Nova integração Manychat criada: ${integration.name}`);
      res.status(201).json(integration);
    } catch (error) {
      console.error('Error creating Manychat integration:', error);
      res.status(500).json({ error: 'Failed to create integration' });
    }
  });

  // Update Manychat integration
  app.put('/api/settings/integrations/manychat/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid integration ID' });
      }

      const validationResult = insertManychatIntegrationSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid data', 
          details: validationResult.error.errors 
        });
      }

      const integration = await storage.manychat.updateIntegration(id, validationResult.data);
      
      console.log(`✅ Integração Manychat atualizada: ${integration.name}`);
      res.json(integration);
    } catch (error) {
      console.error('Error updating Manychat integration:', error);
      res.status(500).json({ error: 'Failed to update integration' });
    }
  });

  // Delete Manychat integration
  app.delete('/api/settings/integrations/manychat/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid integration ID' });
      }

      await storage.manychat.deleteIntegration(id);
      
      console.log(`🗑️ Integração Manychat removida: ID ${id}`);
      res.json({ success: true, message: 'Integration deleted successfully' });
    } catch (error) {
      console.error('Error deleting Manychat integration:', error);
      res.status(500).json({ error: 'Failed to delete integration' });
    }
  });

  // Test Manychat connection
  app.post('/api/settings/integrations/manychat/test', async (req, res) => {
    try {
      const validationResult = manychatTestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid credentials', 
          details: validationResult.error.errors 
        });
      }

      const { apiKey } = validationResult.data;
      
      console.log('🧪 Testando conexão Manychat...');
      const testResult = await storage.manychat.testManychatConnection(apiKey);
      
      if (testResult.success) {
        console.log('✅ Teste de conexão Manychat bem-sucedido');
      } else {
        console.log('❌ Teste de conexão Manychat falhou:', testResult.error);
      }
      
      res.json(testResult);
    } catch (error) {
      console.error('Error testing Manychat connection:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to test connection',
        message: 'Internal server error'
      });
    }
  });

  // Get webhook logs
  app.get('/api/settings/integrations/manychat/:id/logs', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid integration ID' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.manychat.getWebhookLogs(id, limit);
      
      res.json(logs);
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
      res.status(500).json({ error: 'Failed to fetch webhook logs' });
    }
  });

  // Toggle integration status
  app.patch('/api/settings/integrations/manychat/:id/toggle', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid integration ID' });
      }

      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be a boolean' });
      }

      await storage.manychat.updateIntegrationStatus(id, isActive);
      
      console.log(`🔄 Status da integração Manychat alterado: ID ${id} -> ${isActive ? 'ativa' : 'inativa'}`);
      res.json({ success: true, message: 'Integration status updated' });
    } catch (error) {
      console.error('Error updating integration status:', error);
      res.status(500).json({ error: 'Failed to update integration status' });
    }
  });

  // ==================== FACEBOOK/INSTAGRAM INTEGRATION ====================
  
  // Facebook/Instagram integration routes
  app.use('/api/settings/integrations/facebook', facebookRoutes);
} 