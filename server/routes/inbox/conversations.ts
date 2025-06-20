import { Router } from 'express';
import { storage } from '../../storage';
import { insertConversationSchema } from '@shared/schema';
import { CONVERSATION_STATUS } from './types';
import { logger } from '../../utils/logger';

const router = Router();

// Listar conversas - OTIMIZADO PARA RESOLVER 502 BAD GATEWAY
router.get('/', async (req, res) => {
  const requestTimeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ 
        message: 'Request timeout',
        error: 'Database query exceeded time limit'
      });
    }
  }, 25000); // 25s timeout para evitar 502

  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 150);
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;
    
    const startTime = Date.now();
    logger.debug(`Buscando conversas: limit=${limit}, offset=${offset}`);
    
    let conversations: any;
    
    if (search && search.trim()) {
      // Busca com timeout mais curto
      conversations = await Promise.race([
        storage.searchConversations(search.trim(), Math.min(limit, 50)),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Search timeout')), 15000)
        )
      ]) as any;
      
      clearTimeout(requestTimeout);
      const duration = Date.now() - startTime;
      logger.performance('Busca de conversas', duration, { count: conversations.length });
      
      return res.json(conversations);
    } else {
      // Carregamento padrão com timeout
      conversations = await Promise.race([
        storage.getConversations(limit, offset),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 20000)
        )
      ]) as any;
      
      // Verificação simples de próxima página (sem query extra)
      const hasNextPage = conversations.length === limit;
      
      clearTimeout(requestTimeout);
      const duration = Date.now() - startTime;
      logger.performance('Carregamento de conversas', duration, { 
        count: conversations.length, 
        hasNextPage
      });
      
      return res.json({
        conversations,
        hasNextPage,
        total: conversations.length,
        offset,
        limit
      });
    }
  } catch (error) {
    clearTimeout(requestTimeout);
    
    if (res.headersSent) {
      return;
    }
    
    console.error('Erro na busca de conversas:', error);
    
    if (error instanceof Error && 
        (error.message.includes('timeout') || error.message.includes('TIMEOUT'))) {
      return res.status(504).json({ 
        message: 'Database timeout',
        error: 'Query execution exceeded time limit'
      });
    }
    
    return res.status(500).json({ 
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown database error'
    });
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