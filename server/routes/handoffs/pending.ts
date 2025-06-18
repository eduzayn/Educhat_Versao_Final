import { Router } from 'express';
import { validateHandoffId } from './middleware';
import { db } from '../../db';
import { handoffs } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/handoffs/pending/user/:userId - Handoffs pendentes para usuário
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const pendingHandoffs = await db
      .select()
      .from(handoffs)
      .where(eq(handoffs.toUserId, userId))
      .where(eq(handoffs.status, 'pending'));
    
    res.json({
      success: true,
      handoffs: pendingHandoffs
    });
  } catch (error) {
    console.error('Erro ao buscar handoffs pendentes do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/handoffs/pending/team/:teamId - Handoffs pendentes para equipe
router.get('/team/:teamId', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const pendingHandoffs = await db
      .select()
      .from(handoffs)
      .where(eq(handoffs.toTeamId, teamId))
      .where(eq(handoffs.status, 'pending'));
    
    res.json({
      success: true,
      handoffs: pendingHandoffs
    });
  } catch (error) {
    console.error('Erro ao buscar handoffs pendentes da equipe:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/handoffs/:id/accept - Aceitar handoff
router.post('/:id/accept', validateHandoffId, async (req, res) => {
  try {
    const handoffId = parseInt(req.params.id);
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({
        error: 'userId é obrigatório'
      });
    }
    
    await db
      .update(handoffs)
      .set({
        status: 'accepted',
        acceptedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(handoffs.id, handoffId));
    
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
router.post('/:id/reject', validateHandoffId, async (req, res) => {
  try {
    const handoffId = parseInt(req.params.id);
    const reason = req.body.reason;
    
    await db
      .update(handoffs)
      .set({
        status: 'rejected',
        reason,
        updatedAt: new Date()
      })
      .where(eq(handoffs.id, handoffId));
    
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

export default router; 