import { Router, RequestHandler } from 'express';
import { storage } from '../../storage';
import { assignUserSchema } from './schemas';
import { AuthenticatedRequest } from './types';

export function registerAssignUserRoutes(router: Router) {
  // Atribuir usuário a uma conversa
  const assignUserHandler: RequestHandler = async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const data = assignUserSchema.parse(req.body);

      // Verificar se a conversa existe
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      // Verificar se o usuário existe (se fornecido)
      if (data.userId !== null) {
        const user = await storage.getUser(data.userId);
        if (!user) {
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }
      }

      // Atualizar a conversa
      const updatedConversation = await storage.updateConversation(conversationId, {
        assignedUserId: data.userId,
        assignmentMethod: data.method,
        assignedAt: data.userId ? new Date() : null,
        updatedAt: new Date()
      });

      // Notificar clientes via WebSocket sobre a mudança de atribuição
      const { broadcast } = await import('../../routes/realtime/realtime-broadcast');
      broadcast(conversationId, {
        type: 'conversation_assignment_updated',
        conversationId,
        assignedUserId: data.userId,
        assignmentMethod: data.method,
        assignedAt: data.userId ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      });

      res.json(updatedConversation);
    } catch (error) {
      console.error('Erro ao atribuir usuário:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  };

  router.post('/:id/assign-user', assignUserHandler);
} 