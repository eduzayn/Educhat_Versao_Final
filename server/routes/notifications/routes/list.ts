import { Router } from 'express';

const router = Router();

router.get('/api/notifications', async (req, res) => {
  try {
    // Por enquanto, retornar notificações mock para funcionalidade básica
    const mockNotifications = [
      {
        id: 1,
        type: 'message',
        title: 'Nova mensagem recebida',
        message: 'Você tem uma nova mensagem de João Silva',
        read: false,
        createdAt: new Date().toISOString(),
        data: { conversationId: 123 }
      },
      {
        id: 2,
        type: 'handoff',
        title: 'Transferência pendente',
        message: 'Uma conversa foi transferida para sua equipe',
        read: false,
        createdAt: new Date(Date.now() - 60000).toISOString(),
        data: { handoffId: 456 }
      },
      {
        id: 3,
        type: 'system',
        title: 'Sistema atualizado',
        message: 'O EduChat foi atualizado com novas funcionalidades',
        read: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        data: null
      }
    ];
    
    res.json(mockNotifications);
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 