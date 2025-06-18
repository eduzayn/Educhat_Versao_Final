import { Router } from 'express';
import { storage } from '../../../storage';
import { insertMessageSchema } from '../../../shared/schema';
import { AuthenticatedRequest } from '../../../core/permissions';

const router = Router();

router.post('/api/conversations/:id/messages', async (req: AuthenticatedRequest, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const userId = req.user?.id;
    if (isNaN(conversationId)) {
      return res.status(400).json({ 
        error: 'ID da conversa inválido',
        details: 'O ID da conversa deve ser um número válido'
      });
    }
    const conversation = await storage.conversation.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        error: 'Conversa não encontrada',
        details: `Conversa com ID ${conversationId} não existe`
      });
    }
    const parsedData = insertMessageSchema.parse({
      ...req.body,
      conversationId,
    });
    const message = await storage.createMessage(parsedData);
    const { broadcast, broadcastToAll } = await import('../../realtime');
    broadcast(conversationId, {
      type: 'new_message',
      conversationId,
      message,
    });
    broadcastToAll({
      type: 'new_message',
      conversationId,
      message
    });
    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Dados da mensagem inválidos',
          details: error.message,
          validationErrors: (error as any).issues || []
        });
      }
      return res.status(400).json({ 
        error: 'Erro ao criar mensagem',
        details: error.message
      });
    }
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: 'Falha inesperada ao processar a mensagem'
    });
  }
});

export default router; 