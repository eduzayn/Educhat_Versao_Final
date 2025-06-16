import { Router } from 'express';

const router = Router();

// Marcar notificação como lida
router.post('/api/notifications/:id/read', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    console.log(`Marcando notificação ${notificationId} como lida`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Marcar todas as notificações como lidas
router.post('/api/notifications/read-all', async (req, res) => {
  try {
    console.log('Marcando todas as notificações como lidas');
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 