import type { Express } from "express";
import { storage } from "../../core/storage";
import { insertConversationSchema, insertContactNoteSchema } from "@shared/schema";
import { conversationsRateLimit, messagesRateLimit, createRateLimiter } from "../../middleware/rateLimiter";

export function registerInboxRoutes(app: Express) {
  
  // Busca de conversas no banco de dados completo - DEVE ESTAR ANTES da rota genérica
  app.get('/api/conversations/search', conversationsRateLimit, async (req, res) => {
    try {
      const searchTerm = req.query.q as string;
      
      if (!searchTerm || searchTerm.trim().length < 1) {
        return res.status(400).json({ 
          message: 'Termo de busca obrigatório',
          details: 'Forneça um termo de busca válido'
        });
      }
      
      const conversations = await storage.searchConversations(searchTerm.trim());
      res.json(conversations);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      res.status(500).json({ message: 'Falha na busca de conversas' });
    }
  });

  // Conversations endpoints
  app.get('/api/conversations', conversationsRateLimit, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20; // Limite padrão reduzido para 20
      const offset = (page - 1) * limit;
      
      // Novos filtros para usuário e equipe
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
      const unassignedOnly = req.query.unassigned === 'true';
      
      // Validar limite máximo para evitar sobrecarga
      const maxLimit = 100;
      const safeLimit = Math.min(limit, maxLimit);
      
      let conversations;
      
      // Aplicar filtros específicos no backend
      if (userId) {
        conversations = await storage.getConversationsByUser(userId);
        // Aplicar paginação após filtro
        conversations = conversations.slice(offset, offset + safeLimit);
      } else if (teamId) {
        conversations = await storage.getConversationsByTeam(teamId);
        // Aplicar paginação após filtro
        conversations = conversations.slice(offset, offset + safeLimit);
      } else if (unassignedOnly) {
        const allConversations = await storage.getConversations(1000, 0); // Buscar mais conversas para filtrar
        conversations = allConversations.filter(conv => !conv.assignedUserId && !conv.assignedTeamId);
        // Aplicar paginação após filtro
        conversations = conversations.slice(offset, offset + safeLimit);
      } else {
        conversations = await storage.getConversations(safeLimit, offset);
      }
      
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  // Get total unread count - deve vir ANTES da rota genérica :id
  app.get('/api/conversations/unread-count', conversationsRateLimit, async (req, res) => {
    try {
      const totalUnread = await storage.getTotalUnreadCount();
      res.json({ count: totalUnread });
    } catch (error) {
      console.error('Erro ao buscar total de mensagens não lidas:', error);
      res.status(500).json({ message: 'Falha ao buscar contadores' });
    }
  });

  app.get('/api/conversations/:id', conversationsRateLimit, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validação básica do ID
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ 
          message: 'ID da conversa inválido',
          details: 'O ID deve ser um número positivo válido',
          conversationId: req.params.id
        });
      }
      
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ 
          message: 'Conversa não encontrada',
          details: `Nenhuma conversa encontrada com o ID ${id}`,
          conversationId: id
        });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error(`Erro crítico ao buscar conversa ${req.params.id}:`, error);
      res.status(500).json({ 
        message: 'Erro interno do servidor',
        details: 'Falha ao carregar dados da conversa. Tente novamente em alguns segundos.',
        conversationId: req.params.id
      });
    }
  });

  app.post('/api/conversations', async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      // Validações específicas antes do schema
      if (!req.body.contactId) {
        return res.status(400).json({ 
          message: 'ID do contato é obrigatório',
          details: 'O campo contactId deve ser fornecido para criar uma conversa'
        });
      }
      
      if (!req.body.channel) {
        return res.status(400).json({ 
          message: 'Canal é obrigatório',
          details: 'O campo channel deve ser fornecido (ex: whatsapp, instagram)'
        });
      }
      
      if (req.body.channelId && isNaN(parseInt(req.body.channelId))) {
        return res.status(400).json({ 
          message: 'ID do canal inválido',
          details: 'O channelId deve ser um número válido'
        });
      }
      
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
      
      // Mensagens de erro mais específicas
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Dados de conversa inválidos',
          details: 'Verifique se todos os campos obrigatórios foram preenchidos corretamente',
          validationErrors: (error as any).errors
        });
      }
      
      res.status(400).json({ 
        message: 'Erro ao criar conversa',
        details: 'Verifique se o contato existe e o canal foi selecionado corretamente'
      });
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

      // FLUXO AUTOMATIZADO: Criar deal automático quando conversa é atribuída
      try {
        if ((validatedData.assignedTeamId !== undefined || validatedData.assignedUserId !== undefined) && 
            (validatedData.assignedTeamId !== null || validatedData.assignedUserId !== null)) {
          
          // Buscar informações da conversa atualizada para o deal
          const fullConversation = await storage.getConversation(id);
          if (fullConversation && fullConversation.contactId) {
            
            // Determinar canal de origem da conversa
            const canalOrigem = fullConversation.channel || 'manual';
            
            // Determinar equipe/tipo baseado na atribuição
            let teamType = 'geral';
            if (validatedData.assignedTeamId) {
              const team = await storage.getTeam(validatedData.assignedTeamId);
              if (team) {
                // CORREÇÃO GLOBAL: Mapear TODAS as equipes para teamTypes padronizados
                const teamTypeMap: { [key: string]: string } = {
                  'Equipe Comercial': 'comercial',
                  'Equipe Suporte': 'suporte', 
                  'Equipe Cobrança': 'cobranca',
                  'Equipe Tutoria': 'tutoria',
                  'Equipe Secretaria': 'secretaria',
                  'Secretaria': 'secretaria',
                  'Secretaria Pós': 'secretaria_pos',
                  'Secretaria Pos': 'secretaria_pos',
                  'Pós-Graduação': 'secretaria_pos',
                  'Pós Graduação': 'secretaria_pos',
                  'Pos Graduacao': 'secretaria_pos',
                  'Financeiro': 'financeiro',
                  'Financeiro Aluno': 'financeiro',
                  'Equipe Financeiro': 'financeiro',
                  'Cobrança': 'cobranca',
                  'Cobranca': 'cobranca',
                  'Equipe Geral': 'geral'
                };
                
                // GLOBAL: Usar nome exato da equipe ou gerar teamType baseado no nome
                teamType = teamTypeMap[team.name] || 
                          teamTypeMap[team.name.toLowerCase()] || 
                          team.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
              }
            }
            
            // Criar deal automático usando função existente
            console.log(`💼 Criando deal automático para atribuição manual: contato ${fullConversation.contactId}, canal ${canalOrigem}, equipe ${teamType}`);
            const newDeal = await storage.createAutomaticDeal(fullConversation.contactId, canalOrigem, teamType);
            
            if (newDeal) {
              console.log(`✅ Deal criado automaticamente na atribuição: ID ${newDeal.id}`);
              
              // Broadcast para atualizar CRM e BI em tempo real
              const { broadcast, broadcastToAll } = await import('../realtime');
              
              // Broadcast específico da conversa
              broadcast(id, {
                type: 'deal_created',
                conversationId: id,
                dealId: newDeal.id,
                contactId: fullConversation.contactId
              });
              
              // Broadcast para CRM
              broadcastToAll({
                type: 'crm_update',
                action: 'deal_created',
                contactId: fullConversation.contactId,
                dealId: newDeal.id,
                teamType: teamType
              });
              
              // Broadcast para BI
              broadcastToAll({
                type: 'bi_update',
                action: 'metrics_updated',
                data: {
                  conversationId: id,
                  contactId: fullConversation.contactId,
                  dealCreated: true,
                  dealId: newDeal.id,
                  teamType: teamType,
                  assignmentMethod: 'manual'
                }
              });
              
              console.log(`📢 Broadcasts enviados: Deal ${newDeal.id} criado na atribuição`);
            }
          }
        }
      } catch (dealError) {
        // Não quebrar a resposta se houver erro na criação do deal
        console.error('❌ Erro ao criar deal automático na atribuição:', dealError);
      }

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

  // Mark conversation as read - rate limiting específico mais generoso
  app.patch('/api/conversations/:id/read', createRateLimiter({
    windowMs: 10 * 1000, // 10 segundos 
    maxRequests: 50, // 50 requisições por 10s - muito mais generoso
    keyGenerator: (req) => `read_${req.ip}_${req.user?.id || 'anonymous'}`
  }), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      console.log(`📖 [API] Marcando conversa ${id} como lida - INÍCIO`, {
        conversationId: id,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });
      
      // Verificar conversa antes de marcar como lida
      const conversationBefore = await storage.getConversation(id);
      console.log(`📖 [API] Estado da conversa ANTES:`, {
        conversationId: id,
        unreadCount: conversationBefore?.unreadCount,
        isRead: conversationBefore?.isRead,
        markedUnreadManually: conversationBefore?.markedUnreadManually
      });
      
      await storage.markConversationAsRead(id);
      
      // Verificar conversa depois de marcar como lida
      const conversationAfter = await storage.getConversation(id);
      console.log(`📖 [API] Estado da conversa DEPOIS:`, {
        conversationId: id,
        unreadCount: conversationAfter?.unreadCount,
        isRead: conversationAfter?.isRead,
        markedUnreadManually: conversationAfter?.markedUnreadManually
      });
      
      // Broadcast para atualizar UI em tempo real
      try {
        const { broadcast } = await import('../realtime');
        broadcast(id, {
          type: 'read_update',
          conversationId: id,
          isRead: true,
          unreadCount: 0
        });
        console.log(`📖 [API] Broadcast enviado para conversa ${id}`);
      } catch (broadcastError) {
        console.warn('Erro no broadcast de conversa lida:', broadcastError);
      }
      
      console.log(`📖 [API] Conversa ${id} marcada como lida - SUCESSO`);
      res.json({ message: 'Conversation marked as read' });
    } catch (error) {
      console.error(`❌ [API] Erro ao marcar conversa como lida:`, {
        conversationId: req.params.id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({ message: 'Failed to mark conversation as read' });
    }
  });

  // Mark conversation as unread
  app.post('/api/conversations/:id/mark-unread', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validação básica do ID
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ 
          message: 'ID da conversa inválido',
          details: 'O ID deve ser um número positivo válido'
        });
      }

      // Verificar se a conversa existe
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ 
          message: 'Conversa não encontrada',
          details: `Nenhuma conversa encontrada com o ID ${id}`
        });
      }

      // Marcar como não lida usando método específico
      await storage.markConversationAsUnread(id);
      
      // Broadcast para notificar mudança de status de leitura
      try {
        const { broadcast } = await import('../realtime');
        broadcast(id, {
          type: 'unread_update',
          conversationId: id,
          unreadCount: 1
        });
      } catch (broadcastError) {
        console.warn('Erro no broadcast de conversa não lida:', broadcastError);
      }
      
      res.json({ message: 'Conversa marcada como não lida' });
    } catch (error) {
      console.error('Erro ao marcar conversa como não lida:', error);
      res.status(500).json({ message: 'Falha ao marcar conversa como não lida' });
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