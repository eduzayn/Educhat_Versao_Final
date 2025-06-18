import { Router } from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { db } from '../../../db';
import { aiContext } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';
import { aiConfigService } from '../../../services/aiConfigService';

const router = Router();

/**
 * POST /api/ia/copilot - Endpoint específico para o Copilot da Prof. Ana
 */
router.post('/', async (req, res) => {
  try {
    const { message, userId, mode = 'copilot', context = 'copilot_internal' } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    console.log('🎓 Copilot Prof. Ana - Processando mensagem:', message);
    console.log('👤 Usuário:', userId);
    
    // Tentar usar IA em tempo real primeiro
    let aiResponse;
    try {
      console.log('🤖 Tentando usar IA em tempo real...');
      aiResponse = await generateAIResponse(message);
      console.log('✅ IA respondeu com sucesso');
    } catch (aiError) {
      console.error('❌ Erro na IA, usando fallback:', aiError);
      aiResponse = generateFallbackResponse(message);
    }
    
    console.log('📊 Resposta do Copilot gerada:', {
      confidence: aiResponse.classification.confidence,
      intent: aiResponse.classification.intent,
      responseLength: aiResponse.message?.length || 0
    });

    res.json(aiResponse);
  } catch (error) {
    console.error('❌ Erro no Copilot Prof. Ana:', error);
    
    // Fallback de emergência
    const emergencyResponse = generateFallbackResponse(req.body.message || 'Olá');
    res.json(emergencyResponse);
  }
});

/**
 * Busca contextos de treinamento ativos do banco de dados
 */
async function getTrainingContexts() {
  try {
    const contexts = await db
      .select({
        name: aiContext.name,
        type: aiContext.type,
        content: aiContext.content
      })
      .from(aiContext)
      .where(eq(aiContext.isActive, true));
    
    return contexts;
  } catch (error) {
    console.error('❌ Erro ao buscar contextos de treinamento:', error);
    return [];
  }
}

/**
 * Gera resposta usando IA em tempo real com configurações do banco
 */
async function generateAIResponse(message: string) {
  // Buscar configurações de IA
  console.log('🔍 Buscando configurações de IA...');
  const config = await aiConfigService.getConfig();
  
  if (!config || !config.isActive) {
    console.log('❌ Configuração de IA não encontrada ou inativa');
    throw new Error('Configuração de IA não encontrada ou inativa');
  }
  
  // Buscar contextos de treinamento personalizados
  console.log('📚 Buscando contextos de treinamento...');
  const trainingContexts = await getTrainingContexts();
  console.log(`✅ ${trainingContexts.length} contextos de treinamento carregados`);
  
  console.log('✅ Configurações de IA carregadas:', {
    hasAnthropicKey: !!config.anthropicApiKey,
    hasOpenAIKey: !!config.openaiApiKey,
    isActive: config.isActive,
    trainingContextsCount: trainingContexts.length
  });

  // Construir prompt com contextos de treinamento personalizados
  let contextualKnowledge = '';
  if (trainingContexts.length > 0) {
    contextualKnowledge = '\n\nBASE DE CONHECIMENTO ESPECÍFICA:\n';
    trainingContexts.forEach((context, index) => {
      contextualKnowledge += `\n${index + 1}. ${context.name.toUpperCase()}:\n${context.content}\n`;
    });
    contextualKnowledge += '\nUSE SEMPRE estas informações específicas para responder perguntas relacionadas. Seja precisa com valores, prazos e procedimentos descritos acima.\n';
  }

  const systemPrompt = `Você é a Prof. Ana, assistente inteligente do EduChat - uma plataforma educacional especializada em cursos de pós-graduação.

CONTEXTO DA EMPRESA:
- EduChat é uma plataforma de comunicação empresarial com foco em educação
- Oferece cursos de pós-graduação em áreas como Neuropsicopedagogia, Psicopedagogia, Educação Especial
- Modalidade EAD com suporte completo aos alunos
- Sistema CRM integrado para gestão de leads e alunos

SUAS RESPONSABILIDADES:
- Responder dúvidas sobre cursos e matrículas
- Orientar sobre uso da plataforma EduChat
- Dar suporte aos colaboradores internos
- Fornecer informações sobre procedimentos e políticas

${contextualKnowledge}

INSTRUÇÕES:
- Seja profissional mas acolhedora
- Use emojis moderadamente para deixar as respostas mais amigáveis
- Para dúvidas específicas sobre valores, sugira contato direto com consultores se não tiver informações precisas
- Para questões técnicas da plataforma, forneça orientações claras
- Mantenha respostas concisas mas informativas
- SEMPRE use as informações da base de conhecimento específica quando disponível

Responda à seguinte mensagem:`;

  // Tentar Anthropic primeiro (serviço principal)
  const anthropicKey = process.env.ANTHROPIC_API_KEY || config.anthropicApiKey;
  if (anthropicKey) {
    try {
      console.log('🔧 Usando Anthropic API...');
      const anthropic = new Anthropic({
        apiKey: anthropicKey,
      });

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: config.responseSettings?.maxTokens || 1000,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n"${message}"`
          }
        ],
      });

      const content = response.content[0];
      if (content && 'text' in content) {
        console.log('✅ Anthropic respondeu com sucesso');
        return {
          message: content.text,
          classification: {
            intent: 'ai_generated',
            confidence: 0.95,
            sentiment: 'neutral',
            urgency: 'medium'
          }
        };
      }
    } catch (error: any) {
      console.error('❌ [ANTHROPIC] Erro detalhado:', {
        message: error.message,
        status: error.status,
        type: error.type,
        error: error.error,
        timestamp: new Date().toISOString()
      });
      
      // Análise específica por tipo de erro
      if (error.status === 401) {
        console.error('🔑 [ANTHROPIC] ERRO DE AUTENTICAÇÃO - Chave de API inválida ou expirada');
      } else if (error.status === 429) {
        console.warn('⏱️ [ANTHROPIC] QUOTA EXCEDIDA - Rate limit atingido');
      } else if (error.status >= 500) {
        console.error('🚨 [ANTHROPIC] ERRO DE SERVIDOR - Problema no serviço externo');
      }
      
      // Se for erro de timeout ou rede, tentar OpenAI
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.status >= 500) {
        console.log('🔄 Erro de rede/timeout no Anthropic, tentando OpenAI...');
        // Continua para tentar OpenAI
      } else {
        console.error('❌ Erro não relacionado à rede no Anthropic:', error.message);
      }
    }
  } else {
    console.log('⚠️ Chave da API Anthropic não encontrada');
  }

  // Tentar OpenAI se Anthropic falhou (apenas se não for problema de quota)
  const openaiKey = process.env.OPENAI_API_KEY || config.openaiApiKey;
  if (openaiKey) {
    try {
      console.log('🔧 Tentando OpenAI como fallback...');
      const openai = new OpenAI({
        apiKey: openaiKey,
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: config.responseSettings?.maxTokens || 800,
        temperature: config.responseSettings?.temperature || 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        console.log('✅ OpenAI respondeu com sucesso');
        return {
          message: content,
          classification: {
            intent: 'ai_generated',
            confidence: 0.9,
            sentiment: 'neutral',
            urgency: 'medium'
          }
        };
      }
    } catch (error: any) {
      console.error('❌ [OPENAI] Erro detalhado:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
        timestamp: new Date().toISOString()
      });
      
      // Análise específica por tipo de erro
      if (error.status === 401) {
        console.error('🔑 [OPENAI] ERRO DE AUTENTICAÇÃO - Chave de API inválida');
      } else if (error.status === 429 || error.code === 'insufficient_quota') {
        console.error('💳 [OPENAI] QUOTA EXCEDIDA - Verificar billing/créditos');
      } else if (error.status >= 500) {
        console.error('🚨 [OPENAI] ERRO DE SERVIDOR - Problema no serviço externo');
      }
    }
  } else {
    console.log('⚠️ Chave da API OpenAI não encontrada');
  }

  // Se chegou aqui, nenhuma IA funcionou
  throw new Error('Nenhuma API de IA disponível ou configurada');
}

/**
 * Gera resposta de fallback inteligente baseada na mensagem
 */
function generateFallbackResponse(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Apenas usar IA em tempo real, sem respostas automáticas
  
  // Resposta específica baseada no contexto da pergunta
  return {
    message: `Desculpe, não tenho informações específicas sobre "${message}" no momento.

Posso ajudar você com:
- Informações sobre cursos e procedimentos
- Orientações sobre uso do sistema EduChat
- Dúvidas sobre processos internos

Poderia reformular sua pergunta ou ser mais específico sobre o que precisa?`,
    classification: {
      intent: 'clarification_needed',
      confidence: 0.6,
      sentiment: 'neutral',
      urgency: 'low'
    }
  };
}

export default router;