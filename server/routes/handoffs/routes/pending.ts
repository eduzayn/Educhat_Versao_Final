import { Router } from 'express';
import { IntelligentHandoffService } from '../../../services/intelligentHandoffService';
import { validateHandoffId } from '../middleware';

const router = Router();
const handoffService = new IntelligentHandoffService();

// GET /api/handoffs/pending/user/:userId - Handoffs pendentes para usuário
router.get('/user/:userId', async (req, res) => {
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
router.get('/team/:teamId', async (req, res) => {
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
router.post('/:id/accept', validateHandoffId, async (req, res) => {
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
router.post('/:id/reject', validateHandoffId, async (req, res) => {
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

export default router; 