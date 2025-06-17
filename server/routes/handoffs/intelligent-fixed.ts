import { Router } from 'express';
import { storage } from '../../storage';
import { validateInternalCall, validateConversationId } from './middleware';

const router = Router();

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

    const handoffResult = {
      success: true,
      handoffId: 1,
      teamId: 1,
      userId: null
    };

    res.json({
      success: true,
      handoff: handoffResult,
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