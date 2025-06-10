import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { aiConfig, insertAiConfigSchema } from '@shared/schema';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

// Get AI configuration
router.get('/config', async (req, res) => {
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
router.post('/config', async (req, res) => {
  try {
    const validatedData = insertAiConfigSchema.parse(req.body);
    
    let [config] = await db.select().from(aiConfig).limit(1);
    
    if (config) {
      // Update existing config
      [config] = await db
        .update(aiConfig)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(eq(aiConfig.id, config.id))
        .returning();
    } else {
      // Create new config
      [config] = await db
        .insert(aiConfig)
        .values(validatedData)
        .returning();
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
    console.error('Erro ao salvar configurações da IA:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
});

// Test API key
router.post('/test-key', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ message: 'Provider e API key são obrigatórios' });
    }

    let testResult = { success: false, message: '' };

    switch (provider) {
      case 'openai':
        try {
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            testResult = { success: true, message: 'Chave OpenAI válida' };
          } else {
            testResult = { success: false, message: 'Chave OpenAI inválida' };
          }
        } catch (error) {
          testResult = { success: false, message: 'Erro ao testar chave OpenAI' };
        }
        break;

      case 'perplexity':
        try {
          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'llama-3.1-sonar-small-128k-online',
              messages: [{ role: 'user', content: 'Test' }],
              max_tokens: 10
            })
          });
          if (response.ok || response.status === 400) { // 400 is expected for minimal test
            testResult = { success: true, message: 'Chave Perplexity válida' };
          } else {
            testResult = { success: false, message: 'Chave Perplexity inválida' };
          }
        } catch (error) {
          testResult = { success: false, message: 'Erro ao testar chave Perplexity' };
        }
        break;

      case 'elevenlabs':
        try {
          const response = await fetch('https://api.elevenlabs.io/v1/user', {
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            testResult = { success: true, message: 'Chave ElevenLabs válida' };
          } else {
            testResult = { success: false, message: 'Chave ElevenLabs inválida' };
          }
        } catch (error) {
          testResult = { success: false, message: 'Erro ao testar chave ElevenLabs' };
        }
        break;

      case 'anthropic':
        try {
          const anthropic = new Anthropic({ apiKey });
          const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Test' }]
          });
          if (response) {
            testResult = { success: true, message: 'Chave Anthropic válida' };
          }
        } catch (error: any) {
          if (error.status === 401) {
            testResult = { success: false, message: 'Chave Anthropic inválida' };
          } else {
            testResult = { success: false, message: 'Erro ao testar chave Anthropic' };
          }
        }
        break;

      default:
        testResult = { success: false, message: 'Provider não suportado' };
    }

    res.json(testResult);
  } catch (error) {
    console.error('Erro ao testar chave de API:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

export default router;