import { Router } from 'express';

const router = Router();

// Criar notificação
router.post('/api/notifications', async (req, res) => {
  try {
    const { userId, type, title, message, data } = req.body;
    
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ error: 'Dados obrigatórios ausentes' });
    }

    const notification = {
      id: Date.now(),
      userId: parseInt(userId),
      type,
      title,
      message,
      data: data || null,
      read: false,
      createdAt: new Date().toISOString()
    };

    console.log('Criando notificação:', notification);
    res.status(201).json(notification);
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Excluir notificação
router.delete('/api/notifications/:id', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    console.log(`Deletando notificação ${notificationId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 