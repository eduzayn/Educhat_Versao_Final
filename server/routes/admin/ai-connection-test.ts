import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { processUnassignedConversations } from '../../services/auto-ai-assignment.js';

const router = Router();

// Configuração dos clientes de IA
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * POST /api/admin/test-ai-connection
 * Testa a conectividade com as APIs de IA da Professora Ana
 */
router.post('/test-ai-connection', async (req: Request, res: Response) => {
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [] as Array<{
      service: string;
      status: 'success' | 'error';
      responseTime: number;
      details: any;
      error?: string;
    }>
  };

  // Teste OpenAI GPT-3.5 (fallback para quota)
  try {
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é a assistente virtual da Professora Ana, especializada em educação e atendimento a estudantes."
        },
        {
          role: "user",
          content: "Teste de conectividade - responda apenas 'Conexão OpenAI funcionando'"
        }
      ],
      max_tokens: 20,
      temperature: 0
    });
    
    const responseTime = Date.now() - startTime;
    
    testResults.tests.push({
      service: 'OpenAI GPT-3.5-Turbo',
      status: 'success',
      responseTime,
      details: {
        model: response.model,
        usage: response.usage,
        response: response.choices[0]?.message?.content || 'Sem resposta'
      }
    });
  } catch (error: any) {
    testResults.tests.push({
      service: 'OpenAI GPT-3.5-Turbo',
      status: 'error',
      responseTime: 0,
      details: null,
      error: error.message || 'Erro desconhecido'
    });
  }

  // Teste Anthropic Claude
  try {
    const startTime = Date.now();
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 20,
      messages: [
        {
          role: "user",
          content: "Teste de conectividade - responda apenas 'Conexão Anthropic funcionando'"
        }
      ]
    });
    
    const responseTime = Date.now() - startTime;
    
    testResults.tests.push({
      service: 'Anthropic Claude-3',
      status: 'success',
      responseTime,
      details: {
        model: response.model,
        usage: response.usage,
        response: response.content[0]?.type === 'text' ? response.content[0].text : 'Sem resposta'
      }
    });
  } catch (error: any) {
    testResults.tests.push({
      service: 'Anthropic Claude-3',
      status: 'error',
      responseTime: 0,
      details: null,
      error: error.message || 'Erro desconhecido'
    });
  }

  // Resumo dos resultados
  const summary = {
    totalTests: testResults.tests.length,
    successful: testResults.tests.filter(t => t.status === 'success').length,
    failed: testResults.tests.filter(t => t.status === 'error').length,
    averageResponseTime: testResults.tests
      .filter(t => t.status === 'success')
      .reduce((acc, t) => acc + t.responseTime, 0) / testResults.tests.filter(t => t.status === 'success').length || 0
  };

  console.log(`🤖 Teste de IA concluído: ${summary.successful}/${summary.totalTests} serviços funcionando`);
  
  res.json({
    ...testResults,
    summary
  });
});

/**
 * GET /api/admin/ai-status
 * Verifica o status básico das chaves de API
 */
router.get('/ai-status', async (req: Request, res: Response) => {
  const status = {
    openai: {
      configured: !!process.env.OPENAI_API_KEY,
      keyPreview: process.env.OPENAI_API_KEY ? 
        `${process.env.OPENAI_API_KEY.substring(0, 7)}...${process.env.OPENAI_API_KEY.substring(-4)}` : 
        null
    },
    anthropic: {
      configured: !!process.env.ANTHROPIC_API_KEY,
      keyPreview: process.env.ANTHROPIC_API_KEY ? 
        `${process.env.ANTHROPIC_API_KEY.substring(0, 7)}...${process.env.ANTHROPIC_API_KEY.substring(-4)}` : 
        null
    }
  };

  res.json(status);
});

/**
 * POST /api/admin/process-all-unassigned
 * Processa todas as conversas não atribuídas automaticamente
 */
router.post('/process-all-unassigned', async (req: Request, res: Response) => {
  try {
    const { maxConversations = 100, minConfidence = 25 } = req.body;
    
    console.log(`🚀 Iniciando processamento completo de conversas não atribuídas`);
    
    const results = await processUnassignedConversations({
      maxConversations,
      minConfidence,
      onlyRecent: false // Processar todas, não apenas recentes
    });

    res.json({
      success: true,
      message: `Processamento concluído: ${results.assigned} conversas atribuídas de ${results.processed} processadas`,
      results
    });
  } catch (error: any) {
    console.error('❌ Erro no processamento automático:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

export default router;