import { Router } from 'express';
import { storage } from '../../storage';
import { insertConversationSchema } from '@shared/schema';
import { CONVERSATION_STATUS } from './types';

const router = Router();

// Listar conversas
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;
    const periodFilter = req.query.periodFilter as string;
    const teamFilter = req.query.teamFilter as string;
    const statusFilter = req.query.statusFilter as string;
    const agentFilter = req.query.agentFilter as string;
    
    // Log para diagnóstico de performance
    const startTime = Date.now();
    console.log(`🔄 Iniciando busca de conversas: limit=${limit}, offset=${offset}, search=${search || 'N/A'}, period=${periodFilter || 'all'}`);
    
    // Filtros para aplicar na query
    const filters = {
      period: periodFilter && periodFilter !== 'all' ? periodFilter : undefined,
      team: teamFilter && teamFilter !== 'all' ? parseInt(teamFilter) : undefined,
      status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
      agent: agentFilter && agentFilter !== 'all' ? parseInt(agentFilter) : undefined
    };
    

    
    // Log de diagnóstico para filtro de agente
    if (agentFilter && agentFilter !== 'all') {
      console.log(`🔍 FILTRO AGENTE DEBUG: agentFilter="${agentFilter}", parsed=${parseInt(agentFilter)}, type=${typeof parseInt(agentFilter)}`);
    }
    
    let conversations;
    if (search && search.trim()) {
      // Busca direta no banco para encontrar conversas antigas
      conversations = await storage.searchConversations(search.trim(), limit, filters);
      // Para busca, retornar formato simples
      const endTime = Date.now();
      console.log(`✅ Conversas carregadas em ${endTime - startTime}ms (${conversations.length} itens)`);
      res.json(conversations);
    } else {
      // Busca normal paginada com filtros
      conversations = await storage.getConversations(limit, offset, filters);
      
      // Buscar uma conversa adicional para verificar se há mais páginas
      const nextPageCheck = await storage.getConversations(1, offset + limit, filters);
      const hasNextPage = nextPageCheck.length > 0;
      
      const endTime = Date.now();
      console.log(`✅ Conversas carregadas em ${endTime - startTime}ms (${conversations.length} itens) - hasNextPage: ${hasNextPage}`);
      
      // Retornar formato compatível com scroll infinito
      res.json({
        conversations,
        hasNextPage,
        total: conversations.length,
        offset,
        limit
      });
    }
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// Contador de não lidas
router.get('/unread-count', async (req, res) => {
  try {
    const totalUnread = await storage.getTotalUnreadCount();
    res.json({ count: totalUnread });
  } catch (error) {
    console.error('Erro ao buscar total de mensagens não lidas:', error);
    res.status(500).json({ message: 'Falha ao buscar contadores' });
  }
});

// Buscar conversa por ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const conversation = await storage.getConversation(id);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Failed to fetch conversation' });
  }
});

// Criar conversa
router.post('/', async (req, res) => {
  try {
    const validatedData = insertConversationSchema.parse(req.body);
    const conversation = await storage.createConversation(validatedData);
    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(400).json({ message: 'Invalid conversation data' });
  }
});

// Atualizar conversa
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertConversationSchema.partial().parse(req.body);
    const conversation = await storage.updateConversation(id, validatedData);
    res.json(conversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(400).json({ message: 'Failed to update conversation' });
  }
});

// Atualizar status da conversa
router.patch('/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    if (!Object.values(CONVERSATION_STATUS).includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const conversation = await storage.updateConversation(id, { status });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Broadcast status update to WebSocket clients
    const { broadcast } = await import('../realtime');
    broadcast(id, {
      type: 'status_update',
      conversationId: id,
      status
    });

    res.json(conversation);
  } catch (error) {
    console.error('Error updating conversation status:', error);
    res.status(500).json({ message: 'Failed to update conversation status' });
  }
});

// Marcar como lida
router.patch('/:id/read', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.markConversationAsRead(id);
    res.json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({ message: 'Failed to mark conversation as read' });
  }
});

// Marcar como não lida
router.post('/:id/mark-unread', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.markConversationAsUnread(id);
    res.json({ message: 'Conversation marked as unread' });
  } catch (error) {
    console.error('Error marking conversation as unread:', error);
    res.status(500).json({ message: 'Failed to mark conversation as unread' });
  }
});

// Recalcular contadores
router.post('/recalculate-unread', async (req, res) => {
  try {
    await storage.recalculateUnreadCounts();
    res.json({ message: 'Contadores recalculados com sucesso' });
  } catch (error) {
    console.error('Erro ao recalcular contadores:', error);
    res.status(500).json({ message: 'Falha ao recalcular contadores' });
  }
});

export default router; 