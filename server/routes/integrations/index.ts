import type { Express } from "express";
import { storage } from "../../core/storage";
import { z } from "zod";
import { insertManychatIntegrationSchema } from "@shared/schema";

const manychatTestSchema = z.object({
  apiKey: z.string().min(1, "API Key é obrigatória")
});

export function registerIntegrationRoutes(app: Express) {
  
  // Get all Manychat integrations
  app.get('/api/integrations/manychat', async (req, res) => {
    try {
      const integrations = await storage.manychat.getIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error('Error fetching Manychat integrations:', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  });

  // Get specific Manychat integration
  app.get('/api/integrations/manychat/:id', async (req, res) => {
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
  app.post('/api/integrations/manychat', async (req, res) => {
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
  app.put('/api/integrations/manychat/:id', async (req, res) => {
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
  app.delete('/api/integrations/manychat/:id', async (req, res) => {
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
  app.post('/api/integrations/manychat/test', async (req, res) => {
    try {
      const validationResult = manychatTestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid credentials', 
          details: validationResult.error.errors 
        });
      }

      const { apiKey, pageAccessToken } = validationResult.data;
      
      console.log('🧪 Testando conexão Manychat...');
      const testResult = await storage.manychat.testManychatConnection(apiKey, pageAccessToken);
      
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

  // Manychat webhook endpoint
  app.post('/api/integrations/manychat/webhook', async (req, res) => {
    try {
      console.log('📨 Webhook Manychat recebido:', JSON.stringify(req.body, null, 2));
      
      // Get active integration
      const activeIntegration = await storage.manychat.getActiveIntegration();
      
      if (!activeIntegration) {
        console.log('⚠️ Nenhuma integração Manychat ativa encontrada');
        return res.status(400).json({ error: 'No active Manychat integration found' });
      }

      // Log the webhook
      const webhookLog = await storage.manychat.createWebhookLog({
        integrationId: activeIntegration.id,
        webhookType: req.body.type || 'unknown',
        payload: req.body,
        processed: false
      });

      // Process the webhook based on type
      try {
        let result = {};
        
        if (req.body.type === 'user_subscribed' || req.body.type === 'lead_capture') {
          // Process as lead capture
          result = await storage.manychat.processManychatLead(req.body, activeIntegration.id);
          
          // Update webhook log with results
          await storage.manychat.markWebhookProcessed(webhookLog.id, true);
          
          console.log('✅ Lead Manychat processado com sucesso:', result);
        } else {
          // Mark as processed but no action taken
          await storage.manychat.markWebhookProcessed(webhookLog.id, true);
          console.log(`ℹ️ Webhook Manychat tipo '${req.body.type}' recebido mas não processado`);
        }

        // Update integration last sync
        await storage.manychat.updateLastSync(activeIntegration.id, true);
        
        res.json({ 
          success: true, 
          message: 'Webhook processed successfully',
          ...result 
        });
      } catch (processingError) {
        // Mark webhook as failed
        await storage.manychat.markWebhookProcessed(
          webhookLog.id, 
          false, 
          processingError instanceof Error ? processingError.message : 'Unknown processing error'
        );
        
        // Update integration error count
        await storage.manychat.updateLastSync(
          activeIntegration.id, 
          false, 
          processingError instanceof Error ? processingError.message : 'Unknown processing error'
        );
        
        throw processingError;
      }
    } catch (error) {
      console.error('❌ Erro no webhook Manychat:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to process webhook'
      });
    }
  });

  // Get webhook logs
  app.get('/api/integrations/manychat/:id/logs', async (req, res) => {
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
  app.patch('/api/integrations/manychat/:id/toggle', async (req, res) => {
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
}