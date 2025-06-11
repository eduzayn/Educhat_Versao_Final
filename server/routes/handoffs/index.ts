import { Router } from 'express';
import { handoffService } from '../../services/handoffService';
import { intelligentHandoffService } from '../../services/intelligentHandoffService';
import { insertHandoffSchema, handoffs as handoffsTable } from '@shared/schema';
import { db } from '../../db';
import { desc } from 'drizzle-orm';
import { z } from 'zod';
import { AIService } from '../../services/aiService';

const router = Router();

// GET /api/handoffs - Buscar todos os handoffs
router.get('/', async (req, res) => {
  try {
    const handoffsList = await db
      .select({
        id: handoffsTable.id,
        conversationId: handoffsTable.conversationId,
        fromUserId: handoffsTable.fromUserId,
        toUserId: handoffsTable.toUserId,
        fromTeamId: handoffsTable.fromTeamId,
        toTeamId: handoffsTable.toTeamId,
        type: handoffsTable.type,
        reason: handoffsTable.reason,
        priority: handoffsTable.priority,
        status: handoffsTable.status,
        aiClassification: handoffsTable.aiClassification,
        metadata: handoffsTable.metadata,
        acceptedAt: handoffsTable.acceptedAt,
        completedAt: handoffsTable.completedAt,
        createdAt: handoffsTable.createdAt,
        updatedAt: handoffsTable.updatedAt
      })
      .from(handoffsTable)
      .orderBy(desc(handoffsTable.createdAt))
      .limit(50);

    res.json({
      success: true,
      handoffs: handoffsList
    });
  } catch (error) {
    console.error('Erro ao buscar handoffs:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/handoffs/stats - Estatísticas dos handoffs
router.get('/stats', async (req, res) => {
  try {
    const stats = await handoffService.getHandoffStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Schema de validação para criar handoff
const createHandoffSchema = z.object({
  conversationId: z.number(),
  fromUserId: z.number().optional(),
  toUserId: z.number().optional(),
  fromTeamId: z.number().optional(),
  toTeamId: z.number().optional(),
  type: z.enum(['manual', 'automatic', 'escalation']),
  reason: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  aiClassification: z.object({
    confidence: z.number(),
    suggestedTeam: z.string().optional(),
    urgency: z.string(),
    frustrationLevel: z.number(),
    intent: z.string()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

// POST /api/handoffs - Criar novo handoff
router.post('/', async (req, res) => {
  try {
    const data = createHandoffSchema.parse(req.body);
    
    // Validar que pelo menos um destino foi fornecido
    if (!data.toUserId && !data.toTeamId) {
      return res.status(400).json({
        error: 'Deve ser fornecido pelo menos toUserId ou toTeamId'
      });
    }

    const handoff = await handoffService.createHandoff(data);
    
    res.status(201).json({
      success: true,
      handoff
    });
  } catch (error) {
    console.error('Erro ao criar handoff:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/handoffs/conversation/:id - Buscar handoffs de uma conversa
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const days = req.query.days ? parseInt(req.query.days as string) : undefined;
    
    const handoffs = await handoffService.getHandoffsForConversation(conversationId, days);
    
    res.json({
      success: true,
      handoffs
    });
  } catch (error) {
    console.error('Erro ao buscar handoffs da conversa:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/handoffs/pending/user/:userId - Handoffs pendentes para usuário
router.get('/pending/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const handoffs = await handoffService.getPendingHandoffsForUser(userId);
    
    res.json({
      success: true,
      handoffs
    });
  } catch (error) {
    console.error('Erro ao buscar handoffs pendentes do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/handoffs/pending/team/:teamId - Handoffs pendentes para equipe
router.get('/pending/team/:teamId', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const handoffs = await handoffService.getPendingHandoffsForTeam(teamId);
    
    res.json({
      success: true,
      handoffs
    });
  } catch (error) {
    console.error('Erro ao buscar handoffs pendentes da equipe:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/handoffs/:id/accept - Aceitar handoff
router.post('/:id/accept', async (req, res) => {
  try {
    const handoffId = parseInt(req.params.id);
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({
        error: 'userId é obrigatório'
      });
    }
    
    await handoffService.acceptHandoff(handoffId, userId);
    
    res.json({
      success: true,
      message: 'Handoff aceito com sucesso'
    });
  } catch (error) {
    console.error('Erro ao aceitar handoff:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// POST /api/handoffs/:id/reject - Rejeitar handoff
router.post('/:id/reject', async (req, res) => {
  try {
    const handoffId = parseInt(req.params.id);
    const reason = req.body.reason;
    
    await handoffService.rejectHandoff(handoffId, reason);
    
    res.json({
      success: true,
      message: 'Handoff rejeitado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao rejeitar handoff:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// POST /api/handoffs/evaluate - Avaliar se conversa precisa de handoff automático
router.post('/evaluate', async (req, res) => {
  try {
    const { conversationId, aiClassification } = req.body;
    
    if (!conversationId || !aiClassification) {
      return res.status(400).json({
        error: 'conversationId e aiClassification são obrigatórios'
      });
    }
    
    const shouldHandoff = await handoffService.evaluateForAutoHandoff(
      conversationId,
      aiClassification
    );
    
    let suggestion = null;
    if (shouldHandoff) {
      suggestion = await handoffService.suggestBestTarget(
        conversationId,
        aiClassification
      );
    }
    
    res.json({
      success: true,
      shouldHandoff,
      suggestion
    });
  } catch (error) {
    console.error('Erro ao avaliar handoff automático:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/handoffs/auto-create - Criar handoff automático baseado na IA
router.post('/auto-create', async (req, res) => {
  try {
    const { conversationId, aiClassification } = req.body;
    
    if (!conversationId || !aiClassification) {
      return res.status(400).json({
        error: 'conversationId e aiClassification são obrigatórios'
      });
    }
    
    // Avaliar se precisa de handoff
    const shouldHandoff = await handoffService.evaluateForAutoHandoff(
      conversationId,
      aiClassification
    );
    
    if (!shouldHandoff) {
      return res.json({
        success: true,
        handoffCreated: false,
        message: 'Handoff automático não necessário'
      });
    }
    
    // Sugerir melhor destino
    const suggestion = await handoffService.suggestBestTarget(
      conversationId,
      aiClassification
    );
    
    // Criar handoff automático
    const handoff = await handoffService.createHandoff({
      conversationId,
      type: 'automatic',
      reason: suggestion.reason,
      priority: aiClassification.urgency === 'critical' ? 'urgent' : 'high',
      toTeamId: suggestion.teamId,
      toUserId: suggestion.userId,
      aiClassification,
      metadata: {
        triggerEvent: 'ai_evaluation',
        customerSentiment: aiClassification.urgency
      }
    });

    // Para handoffs automáticos, executar a transferência imediatamente
    try {
      await handoffService.executeHandoff(handoff.id);
      console.log(`🔄 Handoff automático ${handoff.id} executado automaticamente`);
    } catch (executeError) {
      console.error(`❌ Erro ao executar handoff automático ${handoff.id}:`, executeError);
    }
    
    res.json({
      success: true,
      handoffCreated: true,
      handoff,
      suggestion
    });
  } catch (error) {
    console.error('Erro ao criar handoff automático:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/handoffs/stats - Obter estatísticas de handoffs
router.get('/stats', async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const stats = await handoffService.getHandoffStats(days);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de handoffs:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/handoffs/:id - Buscar handoff por ID
router.get('/:id', async (req, res) => {
  try {
    const handoffId = parseInt(req.params.id);
    const handoff = await handoffService.getHandoffById(handoffId);
    
    if (!handoff) {
      return res.status(404).json({
        error: 'Handoff não encontrado'
      });
    }
    
    res.json({
      success: true,
      handoff
    });
  } catch (error) {
    console.error('Erro ao buscar handoff:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/handoffs/intelligent/analyze - Análise inteligente de handoff com IA + dados reais
router.post('/intelligent/analyze', async (req, res) => {
  try {
    const { conversationId, messageContent } = req.body;
    
    if (!conversationId || !messageContent) {
      return res.status(400).json({
        error: 'conversationId e messageContent são obrigatórios'
      });
    }

    const aiService = new AIService();
    
    // Primeiro, classificar a mensagem com IA
    const aiClassification = await aiService.classifyMessage(
      messageContent,
      0, // contactId será obtido da conversa
      conversationId,
      []
    );

    // Usar análise inteligente integrada
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
router.post('/intelligent/execute', async (req, res) => {
  try {
    const { conversationId, messageContent, type = 'automatic' } = req.body;
    
    if (!conversationId || !messageContent) {
      return res.status(400).json({
        error: 'conversationId e messageContent são obrigatórios'
      });
    }

    const aiService = new AIService();
    
    // Classificar mensagem com IA
    const aiClassification = await aiService.classifyMessage(
      messageContent,
      0,
      conversationId,
      []
    );

    // Analisar e obter recomendação
    const recommendation = await intelligentHandoffService.analyzeAndRecommendHandoff(
      conversationId,
      messageContent,
      aiClassification
    );

    // Executar handoff se recomendação for forte o suficiente
    if (recommendation.confidence >= 60) {
      const handoffId = await intelligentHandoffService.executeIntelligentHandoff(
        conversationId,
        recommendation,
        aiClassification,
        type
      );

      res.json({
        success: true,
        handoffCreated: true,
        handoffId,
        recommendation,
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
router.get('/intelligent/team-capacity', async (req, res) => {
  try {
    const teamCapacities = await intelligentHandoffService.analyzeTeamCapacities();
    
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
router.get('/intelligent/stats', async (req, res) => {
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