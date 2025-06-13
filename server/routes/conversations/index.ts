import { Router } from 'express';
import { storage } from '../../storage';
import { z } from 'zod';
import type { Request, Response } from 'express';

// Interface para requisições autenticadas
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    displayName: string;
    role: string;
    roleId: number;
  };
}

// Middleware de autenticação simplificado
const requireAuth = (req: AuthenticatedRequest, res: Response, next: Function) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
};

const router = Router();

// Schema para validação das atribuições
const assignTeamSchema = z.object({
  teamId: z.number().nullable(),
  method: z.enum(['manual', 'automatic']).default('manual')
});

const assignUserSchema = z.object({
  userId: z.number().nullable(),
  method: z.enum(['manual', 'automatic']).default('manual')
});

// POST /api/conversations/:id/assign-team - Atribuir conversa a uma equipe
router.post('/:id/assign-team', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const validatedData = assignTeamSchema.parse(req.body);
    const { teamId, method } = validatedData;
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID da conversa inválido' 
      });
    }

    // Verificar se a conversa existe
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversa não encontrada' 
      });
    }

    // Se teamId é null, remove a atribuição
    if (teamId === null) {
      await storage.updateConversation(conversationId, {
        assignedTeamId: null,
        assignedUserId: null, // Remove também usuário quando remove equipe
        assignmentMethod: method,
        updatedAt: new Date()
      });

      console.log(`📋 Conversa ${conversationId} removida da equipe (atribuição manual)`);
      
      // Broadcast da mudança
      try {
        const { broadcastToAll } = await import('../realtime');
        broadcastToAll({
          type: 'conversation_unassigned',
          conversationId,
          assignedBy: req.user?.displayName || req.user?.username,
          method
        });
      } catch (broadcastError) {
        console.warn('Erro ao fazer broadcast:', broadcastError);
      }

      return res.json({ 
        success: true, 
        message: 'Conversa movida para fila neutra' 
      });
    }

    // Verificar se a equipe existe
    const team = await storage.getTeam(teamId);
    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Equipe não encontrada' 
      });
    }

    // Atribuir à equipe
    await storage.assignConversationToTeam(conversationId, teamId);
    
    console.log(`📋 Conversa ${conversationId} atribuída à equipe ${team.name} (${method})`);

    // Broadcast da atribuição
    try {
      const { broadcastToAll } = await import('../realtime');
      broadcastToAll({
        type: 'conversation_assigned_to_team',
        conversationId,
        teamId,
        teamName: team.name,
        assignedBy: req.user?.displayName || req.user?.username,
        method
      });
    } catch (broadcastError) {
      console.warn('Erro ao fazer broadcast:', broadcastError);
    }

    res.json({ 
      success: true, 
      message: `Conversa atribuída à equipe ${team.name} com sucesso` 
    });

  } catch (error) {
    console.error('Erro ao atribuir conversa à equipe:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados inválidos', 
        errors: error.errors 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// POST /api/conversations/:id/assign-user - Atribuir conversa a um usuário
router.post('/:id/assign-user', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const validatedData = assignUserSchema.parse(req.body);
    const { userId, method } = validatedData;
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID da conversa inválido' 
      });
    }

    // Verificar se a conversa existe
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversa não encontrada' 
      });
    }

    // Se userId é null, remove apenas a atribuição do usuário
    if (userId === null) {
      await storage.updateConversation(conversationId, {
        assignedUserId: null,
        assignmentMethod: method,
        updatedAt: new Date()
      });

      console.log(`👤 Usuário removido da conversa ${conversationId} (atribuição manual)`);
      
      // Broadcast da mudança
      try {
        const { broadcastToAll } = await import('../realtime');
        broadcastToAll({
          type: 'conversation_user_unassigned',
          conversationId,
          assignedBy: req.user?.displayName || req.user?.username,
          method
        });
      } catch (broadcastError) {
        console.warn('Erro ao fazer broadcast:', broadcastError);
      }

      return res.json({ 
        success: true, 
        message: 'Usuário removido da conversa' 
      });
    }

    // Verificar se o usuário existe
    const users = await storage.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    // Atribuir ao usuário
    await storage.assignConversationToUser(conversationId, userId);
    
    console.log(`👤 Conversa ${conversationId} atribuída ao usuário ${user.displayName} (${method})`);

    // Broadcast da atribuição
    try {
      const { broadcastToAll } = await import('../realtime');
      broadcastToAll({
        type: 'conversation_assigned_to_user',
        conversationId,
        userId,
        userName: user.displayName,
        assignedBy: req.user?.displayName || req.user?.username,
        method
      });
    } catch (broadcastError) {
      console.warn('Erro ao fazer broadcast:', broadcastError);
    }

    res.json({ 
      success: true, 
      message: `Conversa atribuída ao usuário ${user.displayName} com sucesso` 
    });

  } catch (error) {
    console.error('Erro ao atribuir conversa ao usuário:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados inválidos', 
        errors: error.errors 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

export default router;