import type { Express, Request, Response } from "express";
import { storage } from "../../core/storage";

/**
 * Endpoints de Lazy Loading para carregar dados complementares sob demanda
 * Reduz a carga inicial das conversas e melhora performance
 */
export function registerLazyLoadingRoutes(app: Express) {
  
  // LAZY LOADING: Carregar tags do contato sob demanda
  app.get('/api/contacts/:id/tags', async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ message: 'ID do contato inválido' });
      }

      const tags = await storage.getContactTags(contactId);
      res.json({ tags });
    } catch (error) {
      console.error('Erro ao carregar tags do contato:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // LAZY LOADING: Carregar deals do contato sob demanda
  app.get('/api/contacts/:id/deals', async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ message: 'ID do contato inválido' });
      }

      const deals = await storage.getDealsByContact(contactId);
      res.json({ deals });
    } catch (error) {
      console.error('Erro ao carregar deals do contato:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // LAZY LOADING: Carregar informações do canal sob demanda
  app.get('/api/channels/:id/details', async (req: Request, res: Response) => {
    try {
      const channelId = parseInt(req.params.id);
      if (isNaN(channelId)) {
        return res.status(400).json({ message: 'ID do canal inválido' });
      }

      const channel = await storage.getChannel(channelId);
      if (!channel) {
        return res.status(404).json({ message: 'Canal não encontrado' });
      }

      res.json(channel);
    } catch (error) {
      console.error('Erro ao carregar informações do canal:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // LAZY LOADING: Carregar dados de atribuição de conversa sob demanda
  app.get('/api/conversations/:id/assignment', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: 'ID da conversa inválido' });
      }

      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversa não encontrada' });
      }

      // Retornar apenas dados de atribuição
      res.json({
        assignedTeamId: conversation.assignedTeamId,
        assignedUserId: conversation.assignedUserId,
        assignmentMethod: conversation.assignmentMethod,
        assignedAt: conversation.assignedAt
      });
    } catch (error) {
      console.error('Erro ao carregar dados de atribuição:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
}