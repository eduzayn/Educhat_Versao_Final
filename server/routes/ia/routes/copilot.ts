import { Router } from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const router = Router();

// Função para buscar configurações de IA
async function getAIConfig() {
  try {
    const response = await fetch('http://localhost:5000/api/settings/integrations/ai/config');
    if (!response.ok) {
      throw new Error('Falha ao carregar configurações de IA');
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao buscar configurações de IA:', error);
    return null;
  }
}

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
    
    // Tentar usar IA em tempo real
    let aiResponse;
    try {
      aiResponse = await generateAIResponse(message);
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
 * Gera resposta usando IA em tempo real com configurações do banco
 */
async function generateAIResponse(message: string) {
  // Buscar configurações de IA do banco
  const [config] = await db.select().from(aiConfig).limit(1);
  
  if (!config || !config.isActive) {
    throw new Error('Configuração de IA não encontrada ou inativa');
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

INSTRUÇÕES:
- Seja profissional mas acolhedora
- Use emojis moderadamente para deixar as respostas mais amigáveis
- Para dúvidas específicas sobre valores, sugira contato direto com consultores
- Para questões técnicas da plataforma, forneça orientações claras
- Mantenha respostas concisas mas informativas

Responda à seguinte mensagem:`;

  // Tentar Anthropic primeiro se disponível
  if (config.anthropicApiKey) {
    try {
      const anthropic = new Anthropic({
        apiKey: config.anthropicApiKey,
      });

      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
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
    } catch (error) {
      console.error('❌ Erro Anthropic:', error);
    }
  }

  // Tentar OpenAI se Anthropic falhou
  if (config.openaiApiKey) {
    try {
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
    } catch (error) {
      console.error('❌ Erro OpenAI:', error);
    }
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