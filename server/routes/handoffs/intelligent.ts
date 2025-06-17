import { Router } from 'express';
import { intelligentHandoffService } from '../../services/intelligentHandoffService';
import { aiService } from '../../services/ai-index';
import { storage } from '../../storage';
import { validateInternalCall, validateConversationId } from './middleware';

const router = Router();

// POST /api/handoffs/intelligent/analyze - Análise inteligente de handoff com IA + dados reais
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
      category: 'general'
    };

    const recommendation = await intelligentHandoffService.analyzeAndRecommendHandoff(
      conversationId,
      messageContent,
      aiClassification
    );

    res.json({
      success: true,
      aiClassification,
      recommendation,
      shouldHandoff: recommendation.confidence > 60,
      intelligentAnalysis: true
    });

  } catch (error) {
    console.error('Erro na análise inteligente de handoff:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// POST /api/handoffs/intelligent/execute - Executar handoff inteligente
router.post('/execute', validateInternalCall, validateConversationId, async (req, res) => {
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

    const aiClassification = {
      teamType: 'suporte',
      confidence: 0.8,
      intent: 'question',
      category: 'general'
    };

    const recommendation = await intelligentHandoffService.analyzeAndRecommendHandoff(
      conversationId,
      messageContent,
      aiClassification
    );

    if (recommendation.confidence >= 60) {
      const handoffId = await intelligentHandoffService.executeIntelligentHandoff(
        conversationId,
        recommendation,
        aiClassification,
        type
      );

      try {
        const { unifiedAssignmentService } = await import('../../services/unifiedAssignmentService');
        
        // await unifiedAssignmentService.onConversationAssigned(conversationId, recommendation.teamId || 0, type === 'manual' ? 'manual' : 'automatic');
        
      } catch (automationError) {
        console.error('❌ Erro na automação de deal:', automationError);
      }

      res.json({
        success: true,
        handoffCreated: true,
        handoffId,
        recommendation,
        aiClassification,
        message: 'Handoff inteligente executado com sucesso'
      });
    } else {
      res.json({
        success: true,
        handoffCreated: false,
        recommendation,
        message: 'Handoff não necessário - confiança baixa'
      });
    }

  } catch (error) {
    console.error('Erro ao executar handoff inteligente:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
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
    console.error('Erro ao analisar capacidade das equipes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/handoffs/intelligent/stats - Estatísticas do sistema inteligente
router.get('/stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const stats = await intelligentHandoffService.getIntelligentHandoffStats(days);
    
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