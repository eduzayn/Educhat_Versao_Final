import { Router, RequestHandler } from 'express';
import { storage } from '../../storage';
import { assignUserSchema } from './schemas';
import { AuthenticatedRequest } from './types';
import { PermissionService } from '../../core/permissionService';

export function registerAssignUserRoutes(router: Router) {
  // Atribuir usuário a uma conversa
  const assignUserHandler: RequestHandler = async (req, res) => {
    // Verificar se o usuário tem permissão para transferir conversas
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Permitir transferências para atendentes e outros papéis
    const canTransfer = await PermissionService.hasAnyPermission(authReq.user.id, [
      'conversa:transferir',
      'conversa:atribuir',
      'teams:manage'
    ]);

    if (!canTransfer) {
      return res.status(403).json({ error: 'Sem permissão para transferir conversas' });
    }
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

      // Buscar dados completos do usuário para o broadcast (se atribuído)
      let assignedUser = null;
      if (data.userId) {
        assignedUser = await storage.getUser(data.userId);
      }

      // Notificar clientes via WebSocket sobre a mudança de atribuição
      const { broadcast } = await import('../../routes/realtime/realtime-broadcast');
      broadcast(conversationId, {
        type: 'conversation_assignment_updated',
        conversationId,
        assignedUserId: data.userId,
        assignedUser: assignedUser ? {
          id: assignedUser.id,
          displayName: assignedUser.displayName,
          username: assignedUser.username,
          avatar: (assignedUser as any).avatar || null
        } : null,
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