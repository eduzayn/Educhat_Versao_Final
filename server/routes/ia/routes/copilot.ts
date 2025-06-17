import { Router } from 'express';

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
    
    // Para o Copilot, usar fallback inteligente sem dependências de banco
    const fallbackResponse = generateFallbackResponse(message);
    
    console.log('📊 Resposta do Copilot gerada:', {
      confidence: fallbackResponse.classification.confidence,
      intent: fallbackResponse.classification.intent,
      responseLength: fallbackResponse.message?.length || 0
    });

    res.json(fallbackResponse);
  } catch (error) {
    console.error('❌ Erro no Copilot Prof. Ana:', error);
    
    // Fallback de emergência
    const emergencyResponse = generateFallbackResponse(req.body.message || 'Olá');
    res.json(emergencyResponse);
  }
});

/**
 * Gera resposta de fallback inteligente baseada na mensagem
 */
function generateFallbackResponse(message: string) {
  const lowerMessage = message.toLowerCase();
  
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
  
  if (lowerMessage.includes('sistema') || lowerMessage.includes('educhat') || lowerMessage.includes('plataforma') || lowerMessage.includes('como usar')) {
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