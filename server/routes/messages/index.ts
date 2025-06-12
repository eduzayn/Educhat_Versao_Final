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

      // Simplificar verificação de permissões - permitir resposta a todas as conversas para usuários autenticados
      // Para notas internas, verificação básica de autenticação já é suficiente

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



  // Soft delete message (para mensagens recebidas) - REST: POST /api/messages/soft-delete
  app.post('/api/messages/soft-delete', async (req: AuthenticatedRequest, res) => {
    try {
      const { messageId, conversationId } = req.body;

      if (!messageId || !conversationId) {
        return res.status(400).json({ 
          error: 'messageId e conversationId são obrigatórios' 
        });
      }

      // Verificar se a mensagem existe
      const message = await storage.messages.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      // Marcar mensagem como deletada
      await storage.messages.markMessageAsDeleted(messageId);

      // Broadcast para atualizar a interface
      const { broadcast } = await import('../realtime');
      broadcast(conversationId, {
        type: 'message_deleted',
        conversationId,
        messageId,
      });

      res.json({ success: true, message: 'Mensagem removida da interface' });
    } catch (error) {
      console.error('Erro ao fazer soft delete da mensagem:', error);
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

      // Usar o utilitário centralizado para extrair URLs de mídia
      const mediaInfo = extractMediaUrl(
        message.messageType as string,
        message.content,
        message.metadata
      );

      if (!mediaInfo.mediaUrl || !isValidMediaUrl(mediaInfo.mediaUrl)) {
        return res.status(404).json({ error: 'URL da mídia não encontrada ou inválida' });
      }

      // Configurar headers para permitir visualização inline e evitar bloqueio do Chrome
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Cache-Control': 'public, max-age=3600'
      });

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

  // Proxy para imagens para resolver problemas de CORS e bloqueio do Chrome
  app.get('/api/proxy/image/:url', async (req, res) => {
    try {
      const imageUrl = decodeURIComponent(req.params.url);
      
      // Validar URL
      if (!imageUrl || !imageUrl.startsWith('http')) {
        return res.status(400).json({ error: 'URL inválida' });
      }

      // Fazer fetch da imagem com headers mais compatíveis
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'WhatsApp/2.23.24.76 A',
          'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://web.whatsapp.com/',
          'Origin': 'https://web.whatsapp.com',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        console.error(`Erro ao carregar imagem: ${response.status} - ${response.statusText} para URL: ${imageUrl}`);
        
        // Se a imagem não for encontrada ou expirou, retornar SVG placeholder
        if (response.status === 404 || response.status === 403 || response.status === 410) {
          console.log(`⚠️ URL do WhatsApp expirada (${response.status}) - substituindo por placeholder: ${imageUrl}`);
          
          const placeholderSvg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#f3f4f6" stroke="#e5e7eb" stroke-width="1"/>
            <circle cx="100" cy="80" r="25" fill="#d1d5db"/>
            <path d="M85 90 L100 105 L115 90 M70 130 L130 130 M80 150 L120 150" stroke="#9ca3af" stroke-width="2" fill="none"/>
            <text x="100" y="175" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">
              Imagem indisponível
            </text>
          </svg>`;
          
          res.set({
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=300',
            'X-Content-Type-Options': 'nosniff',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Access-Control-Allow-Origin': '*'
          });
          
          return res.send(placeholderSvg);
        }
        
        return res.status(response.status).json({ error: 'Falha ao carregar imagem' });
      }

      // Configurar headers para permitir visualização inline
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      });

      // Stream da imagem
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));

    } catch (error) {
      console.error('❌ Erro no proxy de imagem:', error);
      
      // Retornar SVG placeholder em caso de erro
      const errorSvg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#fef2f2" stroke="#fecaca" stroke-width="1"/>
        <circle cx="100" cy="80" r="25" fill="#f87171"/>
        <path d="M85 70 L115 90 M115 70 L85 90" stroke="#dc2626" stroke-width="3"/>
        <text x="100" y="130" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#dc2626">
          Erro ao carregar
        </text>
        <text x="100" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#dc2626">
          imagem
        </text>
      </svg>`;
      
      res.set({
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*'
      });
      
      res.send(errorSvg);
    }
  });

  // Deletar mensagem recebida (apenas localmente)
  app.patch('/api/messages/:id/delete-received', async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);

      if (isNaN(messageId)) {
        return res.status(400).json({ error: 'ID da mensagem inválido' });
      }

      // Verificar se a mensagem é realmente recebida (isFromContact = true)
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      if (!message.isFromContact) {
        return res.status(400).json({ error: 'Esta operação é apenas para mensagens recebidas' });
      }

      // Verificar se está dentro do prazo de 7 minutos
      const messageTime = new Date(message.sentAt);
      const now = new Date();
      const timeDifference = now.getTime() - messageTime.getTime();
      const sevenMinutesInMs = 7 * 60 * 1000;

      if (timeDifference > sevenMinutesInMs) {
        return res.status(400).json({ error: 'Só é possível deletar mensagens em até 7 minutos' });
      }

      const success = await storage.markMessageAsDeletedByUser(messageId, true);
      
      if (success) {
        res.json({ success: true, message: 'Mensagem removida da sua interface' });
      } else {
        res.status(500).json({ error: 'Erro ao deletar mensagem' });
      }
    } catch (error) {
      console.error('Erro ao deletar mensagem recebida:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Deletar mensagem enviada (localmente + Z-API)
  app.patch('/api/messages/:id/delete-sent', async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const { zapiMessageId, phone } = req.body;

      if (isNaN(messageId)) {
        return res.status(400).json({ error: 'ID da mensagem inválido' });
      }

      // Verificar se a mensagem é realmente enviada (isFromContact = false)
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      if (message.isFromContact) {
        return res.status(400).json({ error: 'Esta operação é apenas para mensagens enviadas' });
      }

      // Verificar se está dentro do prazo de 7 minutos
      const messageTime = new Date(message.sentAt);
      const now = new Date();
      const timeDifference = now.getTime() - messageTime.getTime();
      const sevenMinutesInMs = 7 * 60 * 1000;

      if (timeDifference > sevenMinutesInMs) {
        return res.status(400).json({ error: 'Só é possível deletar mensagens em até 7 minutos' });
      }

      console.log('🗑️ DELETAR MENSAGEM ENVIADA - Iniciando processo completo:', {
        messageId,
        zapiMessageId,
        phone,
        messageTime: messageTime.toISOString(),
        timeDifference: Math.floor(timeDifference / 1000) + 's',
        hasZapiId: !!zapiMessageId
      });

      // Se temos zapiMessageId, deletar via Z-API primeiro (para ambos os usuários)
      let zapiDeletionSuccess = false;
      if (zapiMessageId && phone) {
        try {
          console.log('🌐 DELETAR VIA Z-API - Tentando deletar para ambos os usuários');
          
          // Importar utilitários do Z-API
          const { validateZApiCredentials } = await import('../../core/zapi-utils');
          
          const credentials = validateZApiCredentials();
          if (!credentials.valid) {
            console.error('❌ DELETAR VIA Z-API - Credenciais inválidas:', credentials.error);
            throw new Error(credentials.error);
          }

          const { instanceId, token, clientToken } = credentials;
          const cleanPhone = phone.replace(/\D/g, '');
          
          // URL da API Z-API para deletar mensagem
          const deleteUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/delete-message`;
          
          console.log('🌐 DELETAR VIA Z-API - Fazendo requisição para:', deleteUrl);
          
          const deleteResponse = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
              'Client-Token': clientToken || '',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phone: cleanPhone,
              messageId: zapiMessageId,
              deleteForEveryone: true // Deletar para ambos os usuários
            })
          });

          const deleteResult = await deleteResponse.json();
          
          if (deleteResponse.ok) {
            console.log('✅ DELETAR VIA Z-API - Mensagem deletada com sucesso para ambos os usuários:', deleteResult);
            zapiDeletionSuccess = true;
          } else {
            console.error('❌ DELETAR VIA Z-API - Falha na resposta:', {
              status: deleteResponse.status,
              statusText: deleteResponse.statusText,
              result: deleteResult
            });
          }
        } catch (error) {
          console.error('❌ DELETAR VIA Z-API - Erro na requisição:', error);
        }
      } else {
        console.log('⚠️ DELETAR VIA Z-API - Pulando (zapiMessageId ou phone não fornecidos)');
      }

      // Marcar como deletada localmente
      const success = await storage.markMessageAsDeletedByUser(messageId, true);
      
      if (!success) {
        console.error('❌ DELETAR LOCAL - Falha ao marcar mensagem como deletada no banco');
        return res.status(500).json({ error: 'Erro ao deletar mensagem no banco' });
      }

      console.log('✅ DELETAR LOCAL - Mensagem marcada como deletada localmente');

      // Broadcast para atualizar interface imediatamente
      const { broadcast } = await import('../realtime');
      broadcast(message.conversationId, {
        type: 'message_deleted',
        conversationId: message.conversationId,
        messageId: messageId,
        deletedAt: new Date().toISOString(),
        deletedForEveryone: zapiDeletionSuccess
      });

      // Log final do resultado
      if (zapiDeletionSuccess) {
        console.log('🎉 DELETAR COMPLETO - Mensagem deletada localmente E para ambos os usuários via Z-API');
      } else if (zapiMessageId) {
        console.log('⚠️ DELETAR PARCIAL - Mensagem deletada localmente, mas falha no Z-API');
      } else {
        console.log('📱 DELETAR LOCAL - Mensagem deletada apenas localmente (sem zapiMessageId)');
      }

      res.json({ 
        success: true, 
        message: zapiDeletionSuccess 
          ? 'Mensagem deletada para ambos os usuários' 
          : 'Mensagem removida da sua interface',
        localDeletion: true,
        zapiDeletion: zapiDeletionSuccess,
        deletedForEveryone: zapiDeletionSuccess
      });

    } catch (error) {
      console.error('❌ Erro ao deletar mensagem enviada:', error);
      
      // Retornar erro mais específico
      if (error instanceof Error) {
        res.status(500).json({ 
          error: 'Erro interno do servidor',
          details: error.message
        });
      } else {
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  });
}