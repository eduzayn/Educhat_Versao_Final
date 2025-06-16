import type { Express, Request, Response } from "express";

export function registerNotificationRoutes(app: Express) {
  // Get user notifications - REST: GET /api/notifications
  app.get('/api/notifications', async (req: Request, res: Response) => {
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

  // Mark notification as read - REST: POST /api/notifications/:id/read
  app.post('/api/notifications/:id/read', async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      console.log(`Marcando notificação ${notificationId} como lida`);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Mark all notifications as read - REST: POST /api/notifications/read-all
  app.post('/api/notifications/read-all', async (req: Request, res: Response) => {
    try {
      console.log('Marcando todas as notificações como lidas');
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Create notification - REST: POST /api/notifications
  app.post('/api/notifications', async (req: Request, res: Response) => {
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

  // Delete notification - REST: DELETE /api/notifications/:id
  app.delete('/api/notifications/:id', async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      console.log(`Deletando notificação ${notificationId}`);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}