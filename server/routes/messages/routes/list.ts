import { Router } from 'express';
import { storage } from '../../../storage';

const router = Router();

// Listagem de mensagens com paginação
router.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const startTime = Date.now();
    const id = parseInt(req.params.id);
    let limit = req.query.limit ? parseInt(req.query.limit as string) : 25;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const cursor = req.query.cursor as string;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID da conversa inválido' });
    }
    if (limit > 30) {
      console.warn(`⚠️ Limite reduzido de ${limit} para 30 mensagens para performance`);
      limit = 30;
    }
    console.log(`🔄 Carregando ${limit} mensagens para conversa ${id}`);
    const messages = await storage.message.getMessages(id, limit, offset);
    const hasMore = messages.length === limit;
    const nextCursor = hasMore && messages.length > 0 
      ? messages[messages.length - 1].id.toString()
      : undefined;
    const endTime = Date.now();
    console.log(`✅ Mensagens carregadas em ${endTime - startTime}ms (${messages.length} itens)`);
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    res.json({
      messages,
      hasMore,
      nextCursor,
      total: messages.length,
      loadTime: endTime - startTime
    });
  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    res.status(500).json({ 
      error: 'Falha ao carregar mensagens',
      details: error instanceof Error ? error.message : 'Erro interno'
    });
  }
});

export default router; 