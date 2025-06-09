import { Express, Request, Response } from 'express';
import { storage } from '../../core/storage';

export function registerConversationDetailsRoutes(app: Express) {
  // Endpoint para carregar detalhes da conversa sob demanda
  app.get('/api/conversations/:id/details', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: 'ID da conversa inválido' });
      }

      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversa não encontrada' });
      }

      res.json(conversation);
    } catch (error) {
      console.error('Erro ao buscar detalhes da conversa:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
}