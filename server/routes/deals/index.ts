import { Express, Response } from 'express';
import { AuthenticatedRequest, requirePermission } from '../admin/permissions';
import { storage } from '../../core/storage';

export function registerDealsRoutes(app: Express) {
  
  // Get all deals with filters and pagination - REST: GET /api/deals
  app.get('/api/deals', requirePermission('deals:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { 
        status, 
        assignedUserId, 
        channel, 
        startDate, 
        endDate, 
        stage, 
        teamType,
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
      
      // Use pagination method from storage
      const result = await storage.getDealsWithPagination({
        page: pageNum,
        limit: limitNum,
        teamType: teamType as string,
        stage: stage as string,
        search: search as string
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
  app.get('/api/deals/:id', requirePermission('deals:read'), async (req: AuthenticatedRequest, res: Response) => {
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
  app.post('/api/deals', requirePermission('deals:create'), async (req: AuthenticatedRequest, res: Response) => {
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
        macrosetor,
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
  app.patch('/api/deals/:id', requirePermission('deals:update'), async (req: AuthenticatedRequest, res: Response) => {
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
  app.delete('/api/deals/:id', requirePermission('deals:delete'), async (req: AuthenticatedRequest, res: Response) => {
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

  // Get deals by contact - REST: GET /api/contacts/:contactId/deals
  app.get('/api/contacts/:contactId/deals', requirePermission('deals:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contactId = parseInt(req.params.contactId);
      
      if (isNaN(contactId)) {
        return res.status(400).json({ error: 'ID do contato inválido' });
      }
      
      const deals = await storage.getDealsByContact(contactId);
      
      res.json({ deals });
    } catch (error) {
      console.error('Erro ao buscar negócios do contato:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Move deal to next stage - REST: POST /api/deals/:id/advance-stage
  app.post('/api/deals/:id/advance-stage', requirePermission('deals:update'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      
      if (isNaN(dealId)) {
        return res.status(400).json({ error: 'ID do negócio inválido' });
      }
      
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ error: 'Negócio não encontrado' });
      }
      
      // Definir próximo estágio baseado no estágio atual
      const stageProgression: { [key: string]: string } = {
        'qualification': 'proposal',
        'proposal': 'negotiation',
        'negotiation': 'closed_won',
        'closed_won': 'closed_won', // Já finalizado
        'closed_lost': 'closed_lost' // Já finalizado
      };
      
      const nextStage = stageProgression[deal.stage] || deal.stage;
      
      if (nextStage === deal.stage && ['closed_won', 'closed_lost'].includes(deal.stage)) {
        return res.status(400).json({ 
          error: 'Negócio já está finalizado' 
        });
      }
      
      const updatedDeal = await storage.updateDeal(dealId, { 
        stage: nextStage,
        status: nextStage.startsWith('closed_') ? 'inactive' : 'active'
      });
      
      // Broadcast para clientes conectados
      const { broadcastToAll } = await import('../realtime');
      broadcastToAll({
        type: 'deal_stage_advanced',
        deal: updatedDeal,
        previousStage: deal.stage,
        newStage: nextStage,
        advancedBy: req.user?.displayName || req.user?.username
      });
      
      res.json({ deal: updatedDeal });
    } catch (error) {
      console.error('Erro ao avançar estágio do negócio:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Add note to deal - REST: POST /api/deals/:id/notes
  app.post('/api/deals/:id/notes', requirePermission('deals:update'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (isNaN(dealId)) {
        return res.status(400).json({ error: 'ID do negócio inválido' });
      }
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Conteúdo da nota é obrigatório' });
      }
      
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ error: 'Negócio não encontrado' });
      }
      
      const note = await storage.addDealNote(dealId, {
        content,
        authorId: req.user?.id,
        createdAt: new Date()
      });
      
      // Broadcast para clientes conectados
      const { broadcastToAll } = await import('../realtime');
      broadcastToAll({
        type: 'deal_note_added',
        dealId: dealId,
        note: note,
        authorName: req.user?.displayName || req.user?.username
      });
      
      res.status(201).json({ note });
    } catch (error) {
      console.error('Erro ao adicionar nota ao negócio:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Get deal notes - REST: GET /api/deals/:id/notes
  app.get('/api/deals/:id/notes', requirePermission('deals:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      
      if (isNaN(dealId)) {
        return res.status(400).json({ error: 'ID do negócio inválido' });
      }
      
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ error: 'Negócio não encontrado' });
      }
      
      const notes = await storage.getDealNotes(dealId);
      
      res.json({ notes });
    } catch (error) {
      console.error('Erro ao buscar notas do negócio:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Get deals statistics - REST: GET /api/deals/stats
  app.get('/api/deals/stats', requirePermission('deals:read'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { startDate, endDate, userId, macrosetor } = req.query;
      
      const filters: any = {};
      
      if (startDate && typeof startDate === 'string') {
        filters.startDate = new Date(startDate);
      }
      
      if (endDate && typeof endDate === 'string') {
        filters.endDate = new Date(endDate);
      }
      
      if (userId && typeof userId === 'string') {
        filters.assignedUserId = parseInt(userId);
      }
      
      if (teamType && typeof teamType === 'string') {
        filters.teamType = teamType;
      }
      
      const stats = await storage.getDealStatistics(filters);
      
      res.json({ stats });
    } catch (error) {
      console.error('Erro ao buscar estatísticas de negócios:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Assign deal to user - REST: POST /api/deals/:id/assign
  app.post('/api/deals/:id/assign', requirePermission('deals:update'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (isNaN(dealId)) {
        return res.status(400).json({ error: 'ID do negócio inválido' });
      }
      
      if (!userId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório' });
      }
      
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ error: 'Negócio não encontrado' });
      }
      
      const updatedDeal = await storage.updateDeal(dealId, { 
        assignedUserId: parseInt(userId) 
      });
      
      // Broadcast para clientes conectados
      const { broadcastToAll } = await import('../realtime');
      broadcastToAll({
        type: 'deal_assigned',
        deal: updatedDeal,
        assignedBy: req.user?.displayName || req.user?.username
      });
      
      res.json({ deal: updatedDeal });
    } catch (error) {
      console.error('Erro ao atribuir negócio:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Close deal as won - REST: POST /api/deals/:id/close-won
  app.post('/api/deals/:id/close-won', requirePermission('deals:update'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      const { finalValue, closingNotes } = req.body;
      
      if (isNaN(dealId)) {
        return res.status(400).json({ error: 'ID do negócio inválido' });
      }
      
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ error: 'Negócio não encontrado' });
      }
      
      const updateData: any = {
        stage: 'closed_won',
        status: 'inactive',
        closedAt: new Date()
      };
      
      if (finalValue) {
        updateData.value = parseFloat(finalValue);
      }
      
      if (closingNotes) {
        updateData.closingNotes = closingNotes;
      }
      
      const updatedDeal = await storage.updateDeal(dealId, updateData);
      
      // Broadcast para clientes conectados
      const { broadcastToAll } = await import('../realtime');
      broadcastToAll({
        type: 'deal_closed_won',
        deal: updatedDeal,
        closedBy: req.user?.displayName || req.user?.username
      });
      
      res.json({ deal: updatedDeal });
    } catch (error) {
      console.error('Erro ao fechar negócio como ganho:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Close deal as lost - REST: POST /api/deals/:id/close-lost
  app.post('/api/deals/:id/close-lost', requirePermission('deals:update'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      const { lossReason, closingNotes } = req.body;
      
      if (isNaN(dealId)) {
        return res.status(400).json({ error: 'ID do negócio inválido' });
      }
      
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ error: 'Negócio não encontrado' });
      }
      
      const updateData: any = {
        stage: 'closed_lost',
        status: 'inactive',
        closedAt: new Date()
      };
      
      if (lossReason) {
        updateData.lossReason = lossReason;
      }
      
      if (closingNotes) {
        updateData.closingNotes = closingNotes;
      }
      
      const updatedDeal = await storage.updateDeal(dealId, updateData);
      
      // Broadcast para clientes conectados
      const { broadcastToAll } = await import('../realtime');
      broadcastToAll({
        type: 'deal_closed_lost',
        deal: updatedDeal,
        closedBy: req.user?.displayName || req.user?.username
      });
      
      res.json({ deal: updatedDeal });
    } catch (error) {
      console.error('Erro ao fechar negócio como perdido:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
}