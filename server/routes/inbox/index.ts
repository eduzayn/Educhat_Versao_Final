import type { Express } from "express";
import { storage } from "../../core/storage";
import { insertConversationSchema, insertContactNoteSchema } from "@shared/schema";

export function registerInboxRoutes(app: Express) {
  
  // Conversations endpoints
  app.get('/api/conversations', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 1000; // Aumentado para carregar mais conversas
      const offset = (page - 1) * limit;
      
      const conversations = await storage.getConversations(limit, offset);
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

  app.post('/api/conversations', async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const validatedData = insertConversationSchema.parse({
        ...req.body,
        assignedUserId: userId // Atribuir automaticamente ao usuário logado
      });
      const conversation = await storage.createConversation(validatedData);
      
      // Broadcast para notificar criação de nova conversa
      try {
        const { broadcastToAll } = await import('../realtime');
        broadcastToAll({
          type: 'new_conversation',
          conversation: conversation
        });
      } catch (broadcastError) {
        console.warn('Erro no broadcast de nova conversa:', broadcastError);
      }
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(400).json({ message: 'Invalid conversation data' });
    }
  });

  app.patch('/api/conversations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validar ID da conversa
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ 
          message: 'ID da conversa inválido',
          details: 'O ID deve ser um número positivo válido'
        });
      }

      // Verificar se a conversa existe
      const existingConversation = await storage.getConversation(id);
      if (!existingConversation) {
        return res.status(404).json({ 
          message: 'Conversa não encontrada',
          details: `Nenhuma conversa encontrada com o ID ${id}`
        });
      }

      const validatedData = insertConversationSchema.partial().parse(req.body);
      
      // Validações específicas para atribuição de equipe
      if (validatedData.assignedTeamId !== undefined) {
        if (validatedData.assignedTeamId !== null) {
          const team = await storage.getTeam(validatedData.assignedTeamId);
          if (!team) {
            return res.status(400).json({ 
              message: 'Equipe não encontrada',
              details: `A equipe com ID ${validatedData.assignedTeamId} não existe ou foi removida`
            });
          }
          
          if (!team.isActive) {
            return res.status(400).json({ 
              message: 'Equipe inativa',
              details: `A equipe "${team.name}" está desativada e não pode receber novas atribuições`
            });
          }
        }
      }

      // Validações específicas para atribuição de usuário
      if (validatedData.assignedUserId !== undefined) {
        if (validatedData.assignedUserId !== null) {
          const user = await storage.getSystemUser(validatedData.assignedUserId);
          if (!user) {
            return res.status(400).json({ 
              message: 'Usuário não encontrado',
              details: `O usuário com ID ${validatedData.assignedUserId} não existe ou foi removido`
            });
          }
          
          if (!user.isActive) {
            return res.status(400).json({ 
              message: 'Usuário inativo',
              details: `O usuário "${user.displayName}" está desativado e não pode receber novas atribuições`
            });
          }

          // Verificar se o usuário pertence à equipe (se equipe especificada)
          if (validatedData.assignedTeamId) {
            const userTeams = await storage.getUserTeams(validatedData.assignedUserId);
            const belongsToTeam = userTeams.some(team => team.id === validatedData.assignedTeamId);
            
            if (!belongsToTeam) {
              const teamName = await storage.getTeam(validatedData.assignedTeamId);
              return res.status(400).json({ 
                message: 'Usuário não pertence à equipe',
                details: `O usuário "${user.displayName}" não faz parte da equipe "${teamName?.name || 'selecionada'}"`
              });
            }
          }
        }
      }

      const conversation = await storage.updateConversation(id, validatedData);
      
      // Log detalhado da atribuição para auditoria
      console.log(`✅ Conversa ${id} atualizada:`, {
        assignedTeamId: validatedData.assignedTeamId,
        assignedUserId: validatedData.assignedUserId,
        method: validatedData.method || 'manual',
        timestamp: new Date().toISOString()
      });

      res.json(conversation);
    } catch (error) {
      console.error('Erro ao atualizar conversa:', error);
      
      // Tratamento específico de erros de validação Zod
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Dados inválidos fornecidos',
          details: 'Os dados enviados não estão no formato correto. Verifique os campos e tente novamente.',
          validation_errors: error.errors
        });
      }

      // Erro genérico do banco de dados
      if (error.message?.includes('database') || error.code) {
        return res.status(500).json({ 
          message: 'Erro interno do servidor',
          details: 'Falha na operação do banco de dados. Tente novamente em alguns momentos.'
        });
      }

      // Erro genérico
      res.status(500).json({ 
        message: 'Erro interno do servidor',
        details: 'Ocorreu um erro inesperado. Entre em contato com o suporte se o problema persistir.'
      });
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
}