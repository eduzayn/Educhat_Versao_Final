import type { Express } from "express";
import { Router } from 'express';
import { storage } from "../../storage";
import { z } from "zod";
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { aiConfig, insertAiConfigSchema, systemSettings, insertSystemSettingSchema } from '@shared/schema';
import { insertManychatIntegrationSchema } from "@shared/schema";
import { facebookRoutes } from '../integrations/facebook';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

// Schema para teste de conexão Manychat
const manychatTestSchema = z.object({
  apiKey: z.string().min(1, "API Key é obrigatória")
});

export function registerSettingsRoutes(app: Express) {
  
  // ==================== INTEGRATIONS ROUTES ====================
  
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

  // ==================== AI CONFIGURATION ====================
  
  // Get AI configuration
  app.get('/api/settings/integrations/ai/config', async (req, res) => {
    try {
      let [config] = await db.select().from(aiConfig).limit(1);
      
      // Create default config if none exists
      if (!config) {
        [config] = await db.insert(aiConfig).values({
          enabledFeatures: {
            webSearch: false,
            voiceSynthesis: false,
            imageAnalysis: true,
            contextualMemory: true
          },
          responseSettings: {
            maxTokens: 1000,
            temperature: 0.7,
            model: "claude-sonnet-4-20250514"
          },
          isActive: true
        }).returning();
      }

      // Don't send API keys in response for security
      const safeConfig = {
        ...config,
        openaiApiKey: config.openaiApiKey ? '***CONFIGURED***' : '',
        perplexityApiKey: config.perplexityApiKey ? '***CONFIGURED***' : '',
        elevenlabsApiKey: config.elevenlabsApiKey ? '***CONFIGURED***' : '',
        anthropicApiKey: config.anthropicApiKey ? '***CONFIGURED***' : ''
      };

      res.json(safeConfig);
    } catch (error) {
      console.error('Erro ao buscar configurações da IA:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Update AI configuration
  app.post('/api/settings/integrations/ai/config', async (req, res) => {
    try {
      console.log('📝 Recebendo dados para salvar configuração da IA:', JSON.stringify(req.body, null, 2));
      
      const validatedData = insertAiConfigSchema.parse(req.body);
      console.log('✅ Dados validados pelo schema:', JSON.stringify(validatedData, null, 2));
      
      let [config] = await db.select().from(aiConfig).limit(1);
      console.log('📊 Configuração existente encontrada:', !!config);
      
      if (config) {
        // Update existing config
        console.log('🔄 Atualizando configuração existente ID:', config.id);
        [config] = await db
          .update(aiConfig)
          .set({
            ...validatedData,
            updatedAt: new Date()
          })
          .where(eq(aiConfig.id, config.id))
          .returning();
        console.log('✅ Configuração atualizada com sucesso');
      } else {
        // Create new config
        console.log('🆕 Criando nova configuração');
        [config] = await db
          .insert(aiConfig)
          .values(validatedData)
          .returning();
        console.log('✅ Nova configuração criada com sucesso');
      }

      // Don't send API keys in response
      const safeConfig = {
        ...config,
        openaiApiKey: config.openaiApiKey ? '***CONFIGURED***' : '',
        perplexityApiKey: config.perplexityApiKey ? '***CONFIGURED***' : '',
        elevenlabsApiKey: config.elevenlabsApiKey ? '***CONFIGURED***' : '',
        anthropicApiKey: config.anthropicApiKey ? '***CONFIGURED***' : ''
      };

      res.json(safeConfig);
    } catch (error) {
      console.error('❌ Erro ao salvar configurações da IA:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: 'Dados inválidos', 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  });

  // Test AI connection
  app.post('/api/settings/integrations/ai/test', async (req, res) => {
    try {
      const { anthropicApiKey } = req.body;
      
      if (!anthropicApiKey) {
        return res.status(400).json({ 
          success: false, 
          message: 'Chave da API Anthropic é obrigatória' 
        });
      }

      // Test Anthropic connection
      const anthropic = new Anthropic({
        apiKey: anthropicApiKey,
      });

      const testMessage = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hello" }],
      });

      if (testMessage.content) {
        res.json({ 
          success: true, 
          message: 'Conexão com Anthropic estabelecida com sucesso' 
        });
      } else {
        res.json({ 
          success: false, 
          message: 'Falha na comunicação com Anthropic' 
        });
      }
    } catch (error) {
      console.error('Erro ao testar conexão com IA:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao testar conexão com IA' 
      });
    }
  });

  // ==================== AI DETECTION SETTINGS ====================
  
  // Get AI detection settings
  app.get('/api/settings/integrations/ai/detection', async (req, res) => {
    try {
      const settings = await db.select().from(systemSettings).where(eq(systemSettings.category, 'ai'));
      res.json(settings);
    } catch (error) {
      console.error('Erro ao buscar configurações de detecção IA:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Update AI detection setting
  app.post('/api/settings/integrations/ai/detection', async (req, res) => {
    try {
      const validatedData = insertSystemSettingSchema.parse({
        ...req.body,
        category: 'ai'
      });

      // Check if setting exists
      const [existingSetting] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, validatedData.key))
        .limit(1);

      let setting;
      if (existingSetting) {
        // Update existing setting
        [setting] = await db
          .update(systemSettings)
          .set({
            ...validatedData,
            updatedAt: new Date()
          })
          .where(eq(systemSettings.id, existingSetting.id))
          .returning();
      } else {
        // Create new setting
        [setting] = await db
          .insert(systemSettings)
          .values(validatedData)
          .returning();
      }

      res.json(setting);
    } catch (error) {
      console.error('Erro ao salvar configuração de detecção IA:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: 'Dados inválidos', 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  });

  // ==================== GENERAL SETTINGS ====================
  
  // Get system settings by category
  app.get('/api/settings/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const settings = await db.select().from(systemSettings).where(eq(systemSettings.category, category));
      res.json(settings);
    } catch (error) {
      console.error('Erro ao buscar configurações do sistema:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Update system setting
  app.post('/api/settings/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const validatedData = insertSystemSettingSchema.parse({
        ...req.body,
        category
      });

      // Check if setting exists
      const [existingSetting] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, validatedData.key))
        .limit(1);

      let setting;
      if (existingSetting) {
        // Update existing setting
        [setting] = await db
          .update(systemSettings)
          .set({
            ...validatedData,
            updatedAt: new Date()
          })
          .where(eq(systemSettings.id, existingSetting.id))
          .returning();
      } else {
        // Create new setting
        [setting] = await db
          .insert(systemSettings)
          .values(validatedData)
          .returning();
      }

      res.json(setting);
    } catch (error) {
      console.error('Erro ao salvar configuração do sistema:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: 'Dados inválidos', 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
  });
}