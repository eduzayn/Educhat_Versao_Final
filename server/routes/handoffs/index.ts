import { Router } from 'express';
import { handoffService } from '../../services/handoffService';
import { insertHandoffSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// GET /api/handoffs - Buscar todos os handoffs
router.get('/', async (req, res) => {
  try {
    const handoffs = await db
      .select({
        id: handoffs.id,
        conversationId: handoffs.conversationId,
        fromUserId: handoffs.fromUserId,
        toUserId: handoffs.toUserId,
        fromTeamId: handoffs.fromTeamId,
        toTeamId: handoffs.toTeamId,
        type: handoffs.type,
        reason: handoffs.reason,
        priority: handoffs.priority,
        status: handoffs.status,
        aiClassification: handoffs.aiClassification,
        metadata: handoffs.metadata,
        acceptedAt: handoffs.acceptedAt,
        completedAt: handoffs.completedAt,
        createdAt: handoffs.createdAt,
        updatedAt: handoffs.updatedAt
      })
      .from(handoffs)
      .orderBy(desc(handoffs.createdAt))
      .limit(50);

    res.json({
      success: true,
      handoffs
    });
  } catch (error) {
    console.error('Erro ao buscar handoffs:', error);
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

export default router;