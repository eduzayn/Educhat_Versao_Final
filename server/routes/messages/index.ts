import type { Express } from "express";
import { storage } from "../../core/storage";
import { insertMessageSchema } from "@shared/schema";
import type { AuthenticatedRequest } from "../admin/permissions";
import { extractMediaUrl, isValidMediaUrl } from "../../utils/mediaUrlExtractor";

export function registerMessageRoutes(app: Express) {
  
  // Messages endpoints
  app.get('/api/conversations/:id/messages', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const messages = await storage.getMessages(id, limit, offset);
      res.json(messages); // Return in descending order (newest first for pagination)
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.post('/api/conversations/:id/messages', async (req: AuthenticatedRequest, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.user?.id;

      // Validar ID da conversa
      if (isNaN(conversationId)) {
        return res.status(400).json({ 
          error: 'ID da conversa inválido',
          details: 'O ID da conversa deve ser um número válido'
        });
      }

      // Verificar se a conversa existe
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ 
          error: 'Conversa não encontrada',
          details: `Conversa com ID ${conversationId} não existe`
        });
      }

      // Parse data first to check if it's an internal note
      const parsedData = insertMessageSchema.parse({
        ...req.body,
        conversationId,
      });

      // For internal notes, only check basic authentication
      // For regular messages, check conversation permissions
      if (!parsedData.isInternalNote && userId) {
        const canRespond = await storage.canUserRespondToConversation(userId, conversationId);
        if (!canRespond) {
          return res.status(403).json({ 
            error: 'Você não tem permissão para responder a esta conversa' 
          });
        }
      }

      const message = await storage.createMessage(parsedData);
      
      // Broadcast to WebSocket clients IMMEDIATELY
      const { broadcast, broadcastToAll } = await import('../realtime');
      broadcast(conversationId, {
        type: 'new_message',
        conversationId,
        message,
      });
      
      // Broadcast global para atualizar todas as listas de conversas
      broadcastToAll({
        type: 'new_message',
        conversationId,
        message
      });
      
      // Nota: O envio via Z-API agora é feito pelo frontend após salvar a mensagem localmente
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      
      // Fornecer detalhes específicos do erro
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          return res.status(400).json({ 
            error: 'Dados da mensagem inválidos',
            details: error.message,
            validationErrors: (error as any).issues || []
          });
        }
        
        return res.status(400).json({ 
          error: 'Erro ao criar mensagem',
          details: error.message
        });
      }
      
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: 'Falha inesperada ao processar a mensagem'
      });
    }
  });



  // Get media content for a specific message - REST: GET /api/messages/:id/media
  app.get('/api/messages/:id/media', async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.getMessage(messageId);
      
      if (!message) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      // Verificar se é uma mensagem de mídia
      const mediaTypes = ['image', 'audio', 'video', 'document'];
      if (!message.messageType || !mediaTypes.includes(message.messageType as string)) {
        return res.status(400).json({ error: 'Mensagem não é de mídia' });
      }

      // Usar o utilitário centralizado para extrair URLs de mídia
      const mediaInfo = extractMediaUrl(
        message.messageType as string,
        message.content,
        message.metadata
      );

      if (!mediaInfo.mediaUrl || !isValidMediaUrl(mediaInfo.mediaUrl)) {
        return res.status(404).json({ error: 'URL da mídia não encontrada ou inválida' });
      }

      res.json({
        content: mediaInfo.mediaUrl,
        fileName: mediaInfo.fileName,
        mimeType: mediaInfo.mimeType,
        duration: mediaInfo.duration,
        messageType: message.messageType,
        metadata: message.metadata
      });

    } catch (error) {
      console.error('Erro ao buscar mídia:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}