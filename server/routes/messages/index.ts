import type { Express } from "express";
import { storage } from "../../core/storage";
import { insertMessageSchema } from "@shared/schema";
import type { AuthenticatedRequest } from "../admin/permissions";

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

  // Get audio content for a specific message - REST: GET /api/messages/:id/audio
  app.get('/api/messages/:id/audio', async (req, res) => {
    try {
      const messageId = req.params.id;
      // Tentar buscar por ID interno da mensagem
      if (!isNaN(parseInt(messageId))) {
        const message = await storage.getMessage(parseInt(messageId));
        
        if (message && message.messageType === 'audio' && message.content) {
          // Se o content já é uma data URL válida, retornar
          if (message.content.startsWith('data:audio/') || message.content.startsWith('data:')) {
            return res.json({ 
              success: true, 
              audioUrl: message.content 
            });
          }
        }
      }
      
      // Tentar buscar por messageId nos metadados (mensagens recebidas)
      const messages = await storage.getMessagesByMetadata('messageId', messageId);
      
      for (const message of messages) {
        if (message.messageType === 'audio' && message.content) {
          return res.json({ 
            success: true, 
            audioUrl: message.content 
          });
        }
      }
      return res.status(404).json({ error: 'Áudio não encontrado' });
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
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

      // Retornar a URL da mídia do content ou dos metadados
      let mediaUrl = null;
      let fileName = null;

      // Verificar se a URL está no content (novo formato)
      if (message.content && (message.content.startsWith('http') || message.content.startsWith('data:'))) {
        mediaUrl = message.content;
      }
      
      // Verificar nos metadados como fallback
      if (!mediaUrl && message.metadata && typeof message.metadata === 'object') {
        const metadata = message.metadata as any;
        
        // Tentar diferentes campos de URL baseado no tipo
        if (message.messageType === 'image') {
          mediaUrl = metadata.mediaUrl || metadata.image?.imageUrl || metadata.image?.url || metadata.imageUrl;
          fileName = metadata.fileName || metadata.image?.fileName || 'image.jpg';
        } else if (message.messageType === 'audio') {
          mediaUrl = metadata.mediaUrl || metadata.audio?.audioUrl || metadata.audio?.url || metadata.audioUrl;
          fileName = metadata.fileName || metadata.audio?.fileName || 'audio.mp3';
        } else if (message.messageType === 'video') {
          mediaUrl = metadata.mediaUrl || metadata.video?.videoUrl || metadata.video?.url || metadata.videoUrl;
          fileName = metadata.fileName || metadata.video?.fileName || 'video.mp4';
        } else if (message.messageType === 'document') {
          mediaUrl = metadata.mediaUrl || metadata.document?.documentUrl || metadata.document?.url || metadata.documentUrl;
          fileName = metadata.fileName || metadata.document?.fileName || 'document.pdf';
        }
      }

      if (!mediaUrl) {
        return res.status(404).json({ error: 'URL da mídia não encontrada' });
      }

      res.json({
        content: mediaUrl,
        fileName: fileName,
        messageType: message.messageType,
        metadata: message.metadata
      });

    } catch (error) {
      console.error('Erro ao buscar mídia:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}