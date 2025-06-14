import type { Express } from "express";
import { storage } from "../../storage";
import { insertConversationSchema, insertContactNoteSchema } from "@shared/schema";
import { z } from 'zod';

export function registerInboxRoutes(app: Express) {
  
  // Conversations endpoints
  app.get('/api/conversations', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      
      // Log para diagnóstico de performance
      const startTime = Date.now();
      console.log(`🔄 Iniciando busca de conversas: limit=${limit}, offset=${offset}, search=${search || 'N/A'}`);
      
      let conversations;
      if (search && search.trim()) {
        // Busca direta no banco para encontrar conversas antigas
        conversations = await storage.searchConversations(search.trim(), limit);
      } else {
        // Busca normal paginada
        conversations = await storage.getConversations(limit, offset);
      }
      
      const endTime = Date.now();
      console.log(`✅ Conversas carregadas em ${endTime - startTime}ms (${conversations.length} itens)`);
      
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  // Get total unread count - deve vir ANTES da rota genérica :id
  app.get('/api/conversations/unread-count', async (req, res) => {
    try {
      const totalUnread = await storage.getTotalUnreadCount();
      res.json({ count: totalUnread });
    } catch (error) {
      console.error('Erro ao buscar total de mensagens não lidas:', error);
      res.status(500).json({ message: 'Falha ao buscar contadores' });
    }
  });

  app.get('/api/conversations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ message: 'Failed to fetch conversation' });
    }
  });

  app.post('/api/conversations', async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(400).json({ message: 'Invalid conversation data' });
    }
  });

  app.patch('/api/conversations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertConversationSchema.partial().parse(req.body);
      const conversation = await storage.updateConversation(id, validatedData);
      res.json(conversation);
    } catch (error) {
      console.error('Error updating conversation:', error);
      res.status(400).json({ message: 'Failed to update conversation' });
    }
  });

  // Update conversation status endpoint
  app.patch('/api/conversations/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      const validStatuses = ['open', 'pending', 'resolved', 'closed', 'new', 'in_progress'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      const conversation = await storage.updateConversation(id, { status });
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Broadcast status update to WebSocket clients
      const { broadcast } = await import('../realtime');
      broadcast(id, {
        type: 'status_update',
        conversationId: id,
        status
      });

      res.json(conversation);
    } catch (error) {
      console.error('Error updating conversation status:', error);
      res.status(500).json({ message: 'Failed to update conversation status' });
    }
  });

  // Mark conversation as read
  app.patch('/api/conversations/:id/read', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markConversationAsRead(id);
      res.json({ message: 'Conversation marked as read' });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      res.status(500).json({ message: 'Failed to mark conversation as read' });
    }
  });

  // Mark conversation as unread
  app.post('/api/conversations/:id/mark-unread', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markConversationAsUnread(id);
      res.json({ message: 'Conversation marked as unread' });
    } catch (error) {
      console.error('Error marking conversation as unread:', error);
      res.status(500).json({ message: 'Failed to mark conversation as unread' });
    }
  });

  // Recalculate unread counts
  app.post('/api/conversations/recalculate-unread', async (req, res) => {
    try {
      await storage.recalculateUnreadCounts();
      res.json({ message: 'Contadores recalculados com sucesso' });
    } catch (error) {
      console.error('Erro ao recalcular contadores:', error);
      res.status(500).json({ message: 'Falha ao recalcular contadores' });
    }
  });

  // Contact notes endpoints
  app.get('/api/contact-notes/contact/:contactId', async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      const notes = await storage.getContactNotes(contactId);
      res.json(notes);
    } catch (error) {
      console.error('Error fetching contact notes:', error);
      res.status(500).json({ message: 'Failed to fetch contact notes' });
    }
  });

  app.post('/api/contact-notes', async (req, res) => {
    try {
      const validatedData = insertContactNoteSchema.parse(req.body);
      const note = await storage.createContactNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      console.error('Error creating contact note:', error);
      res.status(400).json({ message: 'Invalid note data' });
    }
  });

  app.patch('/api/contact-notes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContactNoteSchema.partial().parse(req.body);
      const note = await storage.updateContactNote(id, validatedData);
      res.json(note);
    } catch (error) {
      console.error('Error updating contact note:', error);
      res.status(400).json({ message: 'Failed to update contact note' });
    }
  });

  app.delete('/api/contact-notes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContactNote(id);
      res.json({ message: 'Note deleted successfully' });
    } catch (error) {
      console.error('Error deleting contact note:', error);
      res.status(500).json({ message: 'Failed to delete contact note' });
    }
  });

  // Schemas para validação das atribuições
  const assignTeamSchema = z.object({
    teamId: z.number().nullable(),
    method: z.enum(['manual', 'automatic']).default('manual')
  });

  const assignUserSchema = z.object({
    userId: z.number().nullable(),
    method: z.enum(['manual', 'automatic']).default('manual')
  });

  // Middleware de autenticação simplificado
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }
    return res.status(401).json({ message: 'Não autenticado' });
  };

  // POST /api/conversations/:id/assign-team - Atribuir conversa a uma equipe
  app.post('/api/conversations/:id/assign-team', requireAuth, async (req: any, res) => {
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
  app.post('/api/conversations/:id/assign-user', requireAuth, async (req: any, res) => {
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
      const user = await storage.getUser(userId);
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
}