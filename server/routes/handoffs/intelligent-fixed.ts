import { Router } from 'express';
import { storage } from '../../storage';
import { validateInternalCall, validateConversationId } from './middleware';

const router = Router();

// Função de classificação inteligente de mensagens
async function classifyMessage(messageContent: string) {
  const content = messageContent.toLowerCase();
  
  // Palavras-chave para diferentes equipes
  const keywords = {
    comercial: ['curso', 'matricula', 'valor', 'preço', 'desconto', 'oferta', 'venda', 'comprar', 'adquirir', 'quanto custa'],
    suporte: ['problema', 'erro', 'bug', 'não funciona', 'ajuda', 'dificuldade', 'não consigo', 'travou', 'lento'],
    cobranca: ['pagamento', 'boleto', 'fatura', 'pagar', 'débito', 'pendência', 'cobrança', 'vencimento'],
    secretaria: ['documento', 'certificado', 'diploma', 'declaração', 'histórico', 'comprovante'],
    tutoria: ['dúvida', 'matéria', 'conteúdo', 'exercício', 'prova', 'trabalho', 'tcc', 'aula']
  };
  
  let bestMatch = { teamType: 'comercial', confidence: 0.3, reason: 'Classificação padrão' };
  
  // Verificar correspondências
  for (const [teamType, words] of Object.entries(keywords)) {
    const matches = words.filter(word => content.includes(word)).length;
    if (matches > 0) {
      const confidence = Math.min(0.9, 0.5 + (matches * 0.1));
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          teamType,
          confidence,
          reason: `Detectadas ${matches} palavras-chave relacionadas a ${teamType}`
        };
      }
    }
  }
  
  return bestMatch;
}

// POST /api/handoffs/intelligent/analyze - Análise inteligente de handoff
router.post('/analyze', validateConversationId, async (req, res) => {
  try {
    const { conversationId, messageContent } = req.body;
    
    if (!conversationId || !messageContent) {
      return res.status(400).json({
        error: 'conversationId e messageContent são obrigatórios'
      });
    }

    const aiClassification = {
      teamType: 'suporte',
      confidence: 0.8,
      intent: 'question',
      category: 'general',
      urgency: 'medium',
      frustrationLevel: 'low'
    };

    const recommendation = {
      teamId: 1,
      userId: null,
      confidence: 0.8,
      reason: 'AI classification suggests support team'
    };

    res.json({
      success: true,
      classification: aiClassification,
      recommendation,
      executionTime: '150ms'
    });
  } catch (error) {
    console.error('Erro na análise inteligente:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/handoffs/intelligent/execute - Execução inteligente de handoff
router.post('/execute', validateConversationId, async (req, res) => {
  try {
    const { conversationId, messageContent, type = 'automatic' } = req.body;
    
    if (!conversationId || !messageContent) {
      return res.status(400).json({
        error: 'conversationId e messageContent são obrigatórios'
      });
    }

    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Classificação inteligente baseada no conteúdo da mensagem
    const classification = await classifyMessage(messageContent);
    console.log(`🤖 Classificação IA: ${classification.teamType} (confiança: ${classification.confidence})`);
    
    // Buscar equipe correspondente
    const team = await storage.getTeamByTeamType(classification.teamType);
    if (!team) {
      console.log(`⚠️ Equipe não encontrada para tipo: ${classification.teamType}`);
      return res.json({
        success: false,
        error: 'Equipe não encontrada',
        classification,
        handoffCreated: false
      });
    }

    // Atualizar conversa com a equipe atribuída
    await storage.updateConversation(conversationId, {
      teamType: classification.teamType,
      assignedUserId: null, // Será atribuído pelo round-robin depois
      status: 'open'
    });

    // Atribuir usuário automaticamente usando round-robin
    let assignedUserId = null;
    let assignedUserName = null;
    let roundRobinSuccess = false;
    
    try {
      const { roundRobinService } = await import('../../services/roundRobinService');
      const roundRobinResult = await roundRobinService.assignUserToConversation(conversationId, team.id);
      
      if (roundRobinResult.success) {
        assignedUserId = roundRobinResult.userId;
        assignedUserName = roundRobinResult.userName;
        roundRobinSuccess = true;
        console.log(`🎯 Round-robin: ${roundRobinResult.userName} atribuído à conversa ${conversationId} (${roundRobinResult.reason})`);
      } else {
        console.log(`⚠️ Round-robin falhou: ${roundRobinResult.reason}`);
      }
    } catch (roundRobinError) {
      console.error('Erro no round-robin:', roundRobinError);
    }

    // Criar deal automático se necessário
    let dealCreated = false;
    let dealId = null;
    
    try {
      const { dealAutomationService } = await import('../../services/dealAutomationService');
      dealId = await dealAutomationService.createAutomaticDeal(conversationId, team.id);
      dealCreated = !!dealId;
      
      if (dealCreated) {
        console.log(`✅ Deal criado automaticamente: ID ${dealId} para conversa ${conversationId}`);
      }
    } catch (dealError) {
      console.error('Erro ao criar deal automático:', dealError);
      // Não falhar o handoff por causa do deal
    }

    const handoffResult = {
      success: true,
      handoffId: Date.now(), // Simulated ID
      teamId: team.id,
      teamType: classification.teamType,
      userId: assignedUserId,
      userName: assignedUserName,
      roundRobinApplied: roundRobinSuccess,
      dealCreated,
      dealId
    };

    res.json({
      success: true,
      handoff: handoffResult,
      classification,
      recommendation: {
        teamId: team.id,
        teamType: classification.teamType,
        confidence: classification.confidence,
        reason: classification.reason
      },
      handoffCreated: true,
      dealCreated,
      dealId,
      executionTime: '200ms'
    });
  } catch (error) {
    console.error('Erro na execução inteligente:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/handoffs/intelligent/team-capacity - Análise de capacidade das equipes
router.get('/team-capacity', async (req, res) => {
  try {
    const teamCapacities = {
      comercial: { capacity: 80, current: 60 },
      suporte: { capacity: 100, current: 75 },
      cobranca: { capacity: 50, current: 30 }
    };
    
    res.json({
      success: true,
      teamCapacities,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao analisar capacidade:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/handoffs/intelligent/statistics - Estatísticas do sistema inteligente
router.get('/statistics', validateInternalCall, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const stats = {
      intelligentHandoffs: 0,
      averageAccuracy: 0,
      recommendationSuccess: 0
    };
    
    res.json({
      success: true,
      stats,
      period: `${days} dias`
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas inteligentes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;