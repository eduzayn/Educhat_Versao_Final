import type { Express } from "express";
import { storage } from "../../storage";
import { insertMessageSchema } from "@shared/schema";
import type { AuthenticatedRequest } from "../../permissions";

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
      
      // Se não for uma nota interna E for uma mensagem do agente, enviar via Z-API
      if (!parsedData.isInternalNote && !parsedData.isFromContact) {
        const conversation = await storage.getConversation(conversationId);
        if (conversation && conversation.contact.phone) {
          try {
            console.log('📤 Enviando mensagem via Z-API:', {
              phone: conversation.contact.phone,
              message: parsedData.content,
              conversationId
            });
            
            const response = await fetch('http://localhost:5000/api/zapi/send-message', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                phone: conversation.contact.phone,
                message: parsedData.content,
                conversationId: conversationId.toString()
              })
            });
            
            if (response.ok) {
              console.log('✅ Mensagem enviada via Z-API');
            } else {
              console.log('❌ Erro ao enviar via Z-API:', response.statusText);
            }
          } catch (error) {
            console.error('❌ Erro ao chamar Z-API:', error);
          }
        }
      } else if (parsedData.isInternalNote) {
        console.log('📝 Nota interna criada - não enviada via Z-API');
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(400).json({ message: 'Invalid message data' });
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
      if (!['image', 'audio', 'video', 'document'].includes(message.messageType)) {
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

  // Endpoint para carregar conteúdo de mídia sob demanda
  app.get('/api/messages/:id/media', async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const mediaContent = await storage.getMessageMedia(messageId);
      
      if (!mediaContent) {
        return res.status(404).json({ message: 'Media content not found' });
      }
      
      res.json({ content: mediaContent });
    } catch (error) {
      console.error('Error fetching media content:', error);
      res.status(500).json({ message: 'Failed to fetch media content' });
    }
  });
}