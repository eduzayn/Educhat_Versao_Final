import { Express, Response } from 'express';
import { z } from "zod";
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { aiConfig, insertAiConfigSchema, systemSettings, insertSystemSettingSchema } from '@shared/schema';
import Anthropic from '@anthropic-ai/sdk';

export function registerAIRoutes(app: Express) {
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

      // Mask API keys for security while showing partial info
      const maskApiKey = (key: string) => {
        if (!key) return '';
        if (key.length <= 8) return '•'.repeat(key.length);
        return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
      };

      const safeConfig = {
        ...config,
        openaiApiKey: maskApiKey(config.openaiApiKey),
        perplexityApiKey: maskApiKey(config.perplexityApiKey),
        elevenlabsApiKey: maskApiKey(config.elevenlabsApiKey),
        anthropicApiKey: maskApiKey(config.anthropicApiKey)
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

      // Mask API keys for security while showing partial info
      const maskApiKey = (key: string) => {
        if (!key) return '';
        if (key.length <= 8) return '•'.repeat(key.length);
        return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
      };

      const safeConfig = {
        ...config,
        openaiApiKey: maskApiKey(config.openaiApiKey),
        perplexityApiKey: maskApiKey(config.perplexityApiKey),
        elevenlabsApiKey: maskApiKey(config.elevenlabsApiKey),
        anthropicApiKey: maskApiKey(config.anthropicApiKey)
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
} 