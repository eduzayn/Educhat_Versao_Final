import { Router } from 'express';
import { AuthenticatedRequest, requirePermission } from '../../core/permissions';
import { storage } from '../../storage';

const router = Router();

// Get all deals with filters and pagination - REST: GET /api/deals
router.get('/', requirePermission('deals:read'), async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      status, 
      assignedUserId, 
      channel, 
      startDate, 
      endDate, 
      stage, 
      team,
      funnelId,
      page = '1',
      limit = '50',
      search
    } = req.query;
    
    // Parse pagination parameters
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Página inválida' });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Limite inválido (1-100)' });
    }
    
    // Verificar permissões do usuário para aplicar filtros apropriados
    const userRole = req.user?.role || 'agent';
    const userId = req.user?.id;
    
    let filterUserId = null;
    
    // Se não for admin/manager, filtrar apenas negócios atribuídos ao usuário
    if (!['admin', 'manager', 'superadmin'].includes(userRole)) {
      filterUserId = userId;
    }
    
    console.log('🔍 Debug filtros de negócios:', {
      userRole,
      userId,
      filterUserId,
      team,
      stage,
      search,
      assignedUserId,
      funnelId
    });
    
    // Use pagination method from storage
    const result = await storage.getDealsWithPagination({
      page: pageNum,
      limit: limitNum,
      teamType: team as string,
      stage: stage as string,
      search: search as string,
      userId: filterUserId,
      assignedUserId: assignedUserId as string,
      funnelId: funnelId as string
    });
    
    console.log('📊 Resultado da busca de negócios:', {
      total: result.total,
      dealsCount: result.deals?.length || 0,
      teamType: team
    });
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar negócios:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
});

// Get deal by ID - REST: GET /api/deals/:id
router.get('/:id', requirePermission('deals:read'), async (req: AuthenticatedRequest, res) => {
  try {
    const dealId = parseInt(req.params.id);
    
    if (isNaN(dealId)) {
      return res.status(400).json({ error: 'ID do negócio inválido' });
    }
    
    const deal = await storage.getDeal(dealId);
    
    if (!deal) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }
    
    res.json({ deal });
  } catch (error) {
    console.error('Erro ao buscar negócio:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
});

// Create new deal - REST: POST /api/deals
router.post('/', requirePermission('deals:create'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      contactId,
      title,
      description,
      value,
      stage,
      status,
      expectedCloseDate,
      assignedUserId,
      channel,
      source,
      teamType,
      priority,
      tags
    } = req.body;
    
    // Validações básicas
    if (!contactId || !title) {
      return res.status(400).json({ 
        error: 'ContactId e title são obrigatórios' 
      });
    }
    
    const dealData = {
      contactId: parseInt(contactId),
      title,
      description,
      value: value ? parseFloat(value) : 0,
      stage: stage || 'qualification',
      status: status || 'active',
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
      assignedUserId: assignedUserId ? parseInt(assignedUserId) : req.user?.id,
      channel: channel || 'direct',
      source: source || 'manual',
      teamType: teamType || 'geral',
      priority: priority || 'medium',
      tags: tags || [],
      createdBy: req.user?.id
    };
    
    const deal = await storage.createDeal(dealData);
    
    // Broadcast para clientes conectados
    const { broadcastToAll } = await import('../realtime');
    broadcastToAll({
      type: 'deal_created',
      deal: deal,
      createdBy: req.user?.displayName || req.user?.username
    });
    
    res.status(201).json({ deal });
  } catch (error) {
    console.error('Erro ao criar negócio:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
});

// Update deal - REST: PATCH /api/deals/:id
router.patch('/:id', requirePermission('deals:update'), async (req: AuthenticatedRequest, res) => {
  try {
    const dealId = parseInt(req.params.id);
    
    if (isNaN(dealId)) {
      return res.status(400).json({ error: 'ID do negócio inválido' });
    }
    
    const existingDeal = await storage.getDeal(dealId);
    if (!existingDeal) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }
    
    const updateData = { ...req.body };
    
    // Converter campos de data
    if (updateData.expectedCloseDate) {
      updateData.expectedCloseDate = new Date(updateData.expectedCloseDate);
    }
    
    // Converter campos numéricos
    if (updateData.value) {
      updateData.value = parseFloat(updateData.value);
    }
    
    if (updateData.assignedUserId) {
      updateData.assignedUserId = parseInt(updateData.assignedUserId);
    }
    
    const updatedDeal = await storage.updateDeal(dealId, updateData);
    
    // Broadcast para clientes conectados
    const { broadcastToAll } = await import('../realtime');
    broadcastToAll({
      type: 'deal_updated',
      deal: updatedDeal,
      updatedBy: req.user?.displayName || req.user?.username
    });
    
    res.json({ deal: updatedDeal });
  } catch (error) {
    console.error('Erro ao atualizar negócio:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
});

// Delete deal - REST: DELETE /api/deals/:id
router.delete('/:id', requirePermission('deals:delete'), async (req: AuthenticatedRequest, res) => {
  try {
    const dealId = parseInt(req.params.id);
    
    if (isNaN(dealId)) {
      return res.status(400).json({ error: 'ID do negócio inválido' });
    }
    
    const existingDeal = await storage.getDeal(dealId);
    if (!existingDeal) {
      return res.status(404).json({ error: 'Negócio não encontrado' });
    }
    
    await storage.deleteDeal(dealId);
    
    // Broadcast para clientes conectados
    const { broadcastToAll } = await import('../realtime');
    broadcastToAll({
      type: 'deal_deleted',
      dealId: dealId,
      deletedBy: req.user?.displayName || req.user?.username
    });
    
    res.json({ success: true, message: 'Negócio deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar negócio:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
});

export default router; 