import { Router, RequestHandler } from 'express';
import { storage } from '../../storage';
import { assignTeamSchema } from './schemas';
import { AuthenticatedRequest } from './types';
import { PermissionService } from '../../core/permissionService';

export function registerAssignTeamRoutes(router: Router) {
  // Atribuir equipe a uma conversa
  const assignTeamHandler: RequestHandler = async (req, res) => {
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
      const data = assignTeamSchema.parse(req.body);

      // Verificar se a conversa existe
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      // Verificar se a equipe existe (se fornecida)
      if (data.teamId !== null) {
        const team = await storage.getTeam(data.teamId);
        if (!team) {
          return res.status(404).json({ error: 'Equipe não encontrada' });
        }
      }

      // Atualizar a conversa
      const updatedConversation = await storage.updateConversation(conversationId, {
        assignedTeamId: data.teamId,
        assignmentMethod: data.method,
        updatedAt: new Date()
      });

      // Notificar clientes via WebSocket sobre a mudança de atribuição
      const { broadcast } = await import('../../routes/realtime/realtime-broadcast');
      broadcast(conversationId, {
        type: 'conversation_assignment_updated',
        conversationId,
        assignedTeamId: data.teamId,
        assignmentMethod: data.method,
        updatedAt: new Date().toISOString()
      });

      res.json(updatedConversation);
    } catch (error) {
      console.error('Erro ao atribuir equipe:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  };

  router.post('/:id/assign-team', assignTeamHandler);
} 