import { Router } from 'express';
import { intelligentHandoffService } from '../../services/intelligentHandoffService';
import { handoffs as handoffsTable } from '@shared/schema';
import { db } from '../../db';
import { desc } from 'drizzle-orm';
import { createHandoffSchema } from './config';
import { validateHandoffId } from './middleware';

const router = Router();
const handoffService = new intelligentHandoffService();

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

// POST /api/handoffs - Criar novo handoff
router.post('/', async (req, res) => {
  try {
    const data = createHandoffSchema.parse(req.body);
    
    if (!data.toUserId && !data.toTeamId) {
      return res.status(400).json({
        error: 'Deve ser fornecido pelo menos toUserId ou toTeamId'
      });
    }

    const handoff = await unifiedAssignmentService.createHandoff(data);
    
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

// GET /api/handoffs/:id - Buscar handoff por ID
router.get('/:id', validateHandoffId, async (req, res) => {
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