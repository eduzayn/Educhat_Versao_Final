import { Request, Response, Router } from 'express';
import { Message } from '../types/teams';

const router = Router();

// Buscar mensagens do canal
router.get('/:channelId/messages', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const channelId = req.params.channelId;
    
    // Por enquanto, retornar array vazio - mensagens serão implementadas via Socket.IO
    res.json([]);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar mensagem no canal
router.post('/:channelId/messages', async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const channelId = req.params.channelId;
    const { content, messageType = 'text' } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
    }

    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channelId,
      userId: req.user.id,
      userName: req.user.displayName || req.user.username,
      userAvatar: (req.user as any).avatar,
      content: content.trim(),
      messageType,
      timestamp: new Date(),
      reactions: {}
    };

    // Broadcast da mensagem via Socket.IO seria implementado aqui
    console.log(`📨 Nova mensagem no canal ${channelId}:`, message);

    res.json({ success: true, message });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 