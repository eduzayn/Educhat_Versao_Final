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

  // Tentar Anthropic primeiro se disponível
  if (config.anthropicApiKey) {
    try {
      console.log('🔧 Usando Anthropic API...');
      const anthropic = new Anthropic({
        apiKey: config.anthropicApiKey,
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
  if (config.openaiApiKey) {
    try {
      console.log('🔧 Tentando OpenAI como fallback...');
      const openai = new OpenAI({
        apiKey: config.openaiApiKey,
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
  
  // Prioridade para perguntas sobre sistema/plataforma
  if (lowerMessage.includes('sistema') || lowerMessage.includes('educhat') || lowerMessage.includes('euchat') || lowerMessage.includes('plataforma') || lowerMessage.includes('como usar') || lowerMessage.includes('como funciona') || lowerMessage.includes('funciona') || lowerMessage.includes('como trabalhar')) {
    return {
      message: `Sobre como usar o EduChat:

💻 **Funcionalidades principais:**
- Caixa de Entrada: Gerencie todas as conversas
- Contatos: Organize leads e alunos
- CRM: Acompanhe o funil de vendas
- Relatórios: Analise performance da equipe

📱 **Dicas de uso:**
- Use respostas rápidas para agilizar atendimento
- Configure tags para organizar contatos
- Acompanhe métricas em tempo real
- Use filtros para encontrar conversas específicas

🎯 **Melhores práticas:**
- Responda rapidamente aos leads
- Use tom acolhedor e profissional
- Registre informações importantes nos contatos
- Transfira conversas quando necessário

Precisa de ajuda com alguma funcionalidade específica?`,
      classification: {
        intent: 'technical_support',
        confidence: 0.9,
        sentiment: 'neutral',
        urgency: 'medium'
      }
    };
  }
  
  // Respostas específicas baseadas em palavras-chave
  if (lowerMessage.includes('pós-graduação') || lowerMessage.includes('pos graduacao') || lowerMessage.includes('especialização')) {
    return {
      message: `Sobre nossos cursos de pós-graduação:

🎓 **Oferecemos diversas especializações:**
- Neuropsicopedagogia
- Psicopedagogia Clínica e Institucional
- Educação Especial e Inclusiva
- Gestão Escolar
- Alfabetização e Letramento

📋 **Informações importantes:**
- Modalidade: EAD com encontros presenciais opcionais
- Duração: 12 a 18 meses
- Certificação reconhecida pelo MEC
- Material didático incluso

💰 **Formas de pagamento:**
- À vista com desconto
- Parcelamento em até 18x
- Convênios e descontos especiais

Precisa de mais detalhes sobre algum curso específico?`,
      classification: {
        intent: 'course_inquiry',
        confidence: 0.9,
        sentiment: 'neutral',
        urgency: 'medium'
      }
    };
  }
  
  if (lowerMessage.includes('preço') || lowerMessage.includes('valor') || lowerMessage.includes('custo') || lowerMessage.includes('pagamento')) {
    return {
      message: `Sobre valores e formas de pagamento:

💰 **Investimento nos cursos:**
- Pós-graduação: A partir de R$ 149,90/mês
- Cursos livres: A partir de R$ 49,90/mês
- Graduação: Consulte condições especiais

💳 **Formas de pagamento:**
- Cartão de crédito (até 18x)
- Boleto bancário
- PIX com desconto à vista
- Financiamento estudantil

🎯 **Descontos disponíveis:**
- Pagamento à vista: até 20% de desconto
- Convênios empresariais
- Desconto para profissionais da educação
- Promoções sazonais

Gostaria de simular um valor específico para algum curso?`,
      classification: {
        intent: 'financial',
        confidence: 0.9,
        sentiment: 'neutral',
        urgency: 'medium'
      }
    };
  }
  
  if (lowerMessage.includes('sistema') || lowerMessage.includes('educhat') || lowerMessage.includes('euchat') || lowerMessage.includes('plataforma') || lowerMessage.includes('como usar') || lowerMessage.includes('como funciona') || lowerMessage.includes('funciona') || lowerMessage.includes('como trabalhar')) {
    return {
      message: `Sobre como usar o EduChat:

💻 **Funcionalidades principais:**
- Caixa de Entrada: Gerencie todas as conversas
- Contatos: Organize leads e alunos
- CRM: Acompanhe o funil de vendas
- Relatórios: Analise performance da equipe

📱 **Dicas de uso:**
- Use respostas rápidas para agilizar atendimento
- Configure tags para organizar contatos
- Acompanhe métricas em tempo real
- Use filtros para encontrar conversas específicas

🎯 **Melhores práticas:**
- Responda rapidamente aos leads
- Use tom acolhedor e profissional
- Registre informações importantes nos contatos
- Transfira conversas quando necessário

Precisa de ajuda com alguma funcionalidade específica?`,
      classification: {
        intent: 'technical_support',
        confidence: 0.9,
        sentiment: 'neutral',
        urgency: 'medium'
      }
    };
  }
  
  // Resposta genérica para outras perguntas
  return {
    message: `Olá! Sou a Prof. Ana, sua assistente inteligente.

Posso ajudar você com:

📚 **Informações sobre cursos**
- Detalhes de pós-graduação e graduação
- Valores e formas de pagamento
- Processo de matrícula

💼 **Suporte ao trabalho**
- Como usar o EduChat
- Melhores práticas de atendimento
- Processos internos

🎯 **Orientações gerais**
- Políticas da instituição
- Procedimentos administrativos
- Dúvidas frequentes

Como posso ajudar você especificamente hoje?`,
    classification: {
      intent: 'general_info',
      confidence: 0.7,
      sentiment: 'neutral',
      urgency: 'low'
    }
  };
}

export default router;