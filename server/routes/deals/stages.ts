import { Router } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from '../../storage';

const router = Router();

// Listar estágios existentes a partir dos negócios cadastrados
router.get('/stages', requirePermission('deals:read'), async (req: AuthenticatedRequest, res) => {
  try {
    // Busca todos os estágios distintos dos negócios
    const stages = await storage.getDealsByStage();
    res.json({ stages });
  } catch (error) {
    console.error('Erro ao buscar estágios:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
});

// Status não implementado
router.get('/statuses', requirePermission('deals:read'), async (req: AuthenticatedRequest, res) => {
  res.status(501).json({ error: 'Funcionalidade não implementada' });
});

// Atualizar estágio do negócio - PATCH /api/deals/:id/stage
router.patch('/:id/stage', requirePermission('deals:update'), async (req: AuthenticatedRequest, res) => {
  try {
    const dealId = parseInt(req.params.id);
    const { stage, reason } = req.body;
    
    if (isNaN(dealId)) {
      return res.status(400).json({ error: 'ID do negócio inválido' });
    }
    if (!stage) {
      return res.status(400).json({ error: 'Estágio é obrigatório' });
    }
    const existingDeal = await storage.getDeal(dealId);
    if (!existingDeal) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }
    const updatedDeal = await storage.updateDeal(dealId, { stage });
    // Broadcast para clientes conectados
    const { broadcastToAll } = await import('../realtime');
    broadcastToAll({
      type: 'deal_stage_updated',
      deal: updatedDeal,
      updatedBy: req.user?.displayName || req.user?.username,
      oldStage: existingDeal.stage,
      newStage: stage,
      reason
    });
    res.json({ deal: updatedDeal });
  } catch (error) {
    console.error('Erro ao atualizar estágio do negócio:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
});

// Atualizar status do negócio - PATCH /api/deals/:id/status
router.patch('/:id/status', requirePermission('deals:update'), async (req: AuthenticatedRequest, res) => {
  try {
    const dealId = parseInt(req.params.id);
    const { status, reason } = req.body;
    
    if (isNaN(dealId)) {
      return res.status(400).json({ error: 'ID do negócio inválido' });
    }
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    const existingDeal = await storage.getDeal(dealId);
    if (!existingDeal) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }
    const updatedDeal = await storage.updateDeal(dealId, { status });
    // Broadcast para clientes conectados
    const { broadcastToAll } = await import('../realtime');
    broadcastToAll({
      type: 'deal_status_updated',
      deal: updatedDeal,
      updatedBy: req.user?.displayName || req.user?.username,
      oldStatus: (existingDeal as any).status || null,
      newStatus: status,
      reason
    });
    res.json({ deal: updatedDeal });
  } catch (error) {
    console.error('Erro ao atualizar status do negócio:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
});

export default router; 