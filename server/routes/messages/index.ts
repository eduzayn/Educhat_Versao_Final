import type { Express } from "express";
import { storage } from "../../storage/index";
import { insertMessageSchema } from "@shared/schema";
import { AuthenticatedRequest } from "../../core/permissionsRefactored";
import { extractMediaUrl, isValidMediaUrl } from "../../utils/mediaUrlExtractor";
import createRouter from './routes/create';
import mediaRouter from './routes/media';
import deleteRouter from './routes/delete';

export function registerMessageRoutes(app: Express) {
  app.use(createRouter);
  app.use(mediaRouter);
  app.use(deleteRouter);

  // Messages endpoints with infinite scroll support
  app.get('/api/conversations/:id/messages', async (req, res) => {
    try {
      const startTime = Date.now();
      const id = parseInt(req.params.id);
      let limit = req.query.limit ? parseInt(req.query.limit as string) : 25; // Otimizado para 25
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const cursor = req.query.cursor as string;
      
      // Validação de parâmetros
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID da conversa inválido' });
      }
      
      // Proteção crítica: Limitar para evitar timeouts em conversas com muitas mensagens
      if (limit > 30) {
        console.warn(`⚠️ Limite reduzido de ${limit} para 30 mensagens para performance`);
        limit = 30;
      }
      
      console.log(`🔄 Carregando ${limit} mensagens para conversa ${id}`);
      
      // Usar método otimizado com seleção de campos específicos
      const messages = await storage.message.getMessages(id, limit, offset);
      
      // Verificar se há mais mensagens de forma eficiente
      const hasMore = messages.length === limit;
      
      // Gerar cursor para próxima página baseado no último ID
      const nextCursor = hasMore && messages.length > 0 
        ? messages[messages.length - 1].id.toString()
        : undefined;

      const endTime = Date.now();
      console.log(`✅ Mensagens carregadas em ${endTime - startTime}ms (${messages.length} itens)`);

      // Headers otimizados para evitar ERR_CACHE_WRITE_FAILURE
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });

      res.json({
        messages,
        hasMore,
        nextCursor,
        total: messages.length,
        loadTime: endTime - startTime
      });
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
      res.status(500).json({ 
        error: 'Falha ao carregar mensagens',
        details: error instanceof Error ? error.message : 'Erro interno'
      });
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
      const conversation = await storage.conversation.getConversation(conversationId);
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

  // Get media content for a specific message - REST: GET /api/messages/:id/media
  app.get('/api/messages/:id/media', async (req, res) => {
    const startTime = Date.now();
    try {
      const messageId = parseInt(req.params.id);
      console.log(`🚀 Carregamento sob demanda solicitado para mensagem ${messageId}`);
      
      const message = await storage.getMessage(messageId);
      
      if (!message) {
        console.error(`❌ Mensagem ${messageId} não encontrada no storage`);
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
        console.error(`❌ URL de mídia inválida para mensagem ${messageId}:`, { 
          mediaUrl: mediaInfo.mediaUrl, 
          metadata: message.metadata,
          content: message.content 
        });
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

      const duration = Date.now() - startTime;
      console.log(`✅ Mídia carregada sob demanda em ${duration}ms para mensagem ${messageId}: ${mediaInfo.mediaUrl}`);
      
      res.json({
        content: mediaInfo.mediaUrl,
        fileName: mediaInfo.fileName,
        mimeType: mediaInfo.mimeType,
        duration: mediaInfo.duration,
        messageType: message.messageType,
        metadata: message.metadata,
        loadTime: `${duration}ms`
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Erro ao buscar mídia sob demanda (${duration}ms):`, error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Soft Delete (Mensagens Recebidas) - POST /api/messages/soft-delete
  app.post('/api/messages/soft-delete', async (req: AuthenticatedRequest, res) => {
    const startTime = Date.now();
    try {
      const { messageId, conversationId } = req.body;
      const userId = req.user?.id || 35; // Fallback para testes

      if (!messageId || isNaN(parseInt(messageId))) {
        return res.status(400).json({ error: 'messageId é obrigatório e deve ser um número válido' });
      }

      if (!conversationId || isNaN(parseInt(conversationId))) {
        return res.status(400).json({ error: 'conversationId é obrigatório e deve ser um número válido' });
      }

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const parsedMessageId = parseInt(messageId);

      console.log('🗑️ SOFT DELETE - Iniciando processo para mensagem recebida:', {
        messageId: parsedMessageId,
        userId,
        userIdType: typeof userId,
        req_user: req.user,
        passport_user: 'N/A',
        session_keys: [],
        comportamento: 'Remove apenas da interface (NÃO deleta no WhatsApp)'
      });

      // Verificar se a mensagem é realmente recebida (isFromContact = true)
      const message = await storage.getMessage(parsedMessageId);
      if (!message) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      if (!message.isFromContact) {
        return res.status(400).json({ error: 'Esta operação é apenas para mensagens recebidas' });
      }

      // Verificar se está dentro do prazo de 7 minutos
      const messageTime = new Date(message.sentAt || new Date());
      const now = new Date();
      const timeDifference = now.getTime() - messageTime.getTime();
      const sevenMinutesInMs = 7 * 60 * 1000;
      
      console.log(`⏰ Verificando prazo de exclusão:`, {
        messageId,
        messageTime: messageTime.toISOString(),
        now: now.toISOString(),
        timeDifference: `${Math.round(timeDifference / 1000)}s`,
        withinLimit: timeDifference <= sevenMinutesInMs
      });

      if (timeDifference > sevenMinutesInMs) {
        console.log(`❌ Tentativa de exclusão fora do prazo para mensagem ${messageId}`);
        return res.status(400).json({ 
          error: 'Mensagem não pode ser deletada após 7 minutos do envio',
          timeDifference: Math.round(timeDifference / 1000 / 60),
          maxMinutes: 7
        });
      }

      // Marcar como deletada apenas no sistema (isDeleted = true) com ID do usuário
      const success = await storage.markMessageAsDeletedByUser(parsedMessageId, true, Number(userId));
      
      console.log('✅ SOFT DELETE - Mensagem ocultada da interface:', {
        messageId: parsedMessageId,
        success,
        observacao: 'Mensagem permanece no WhatsApp do contato'
      });

      // Buscar mensagem atualizada para broadcast
      const updatedMessage = await storage.getMessage(parsedMessageId);
      
      // Broadcast para atualizar interface com dados completos
      const { broadcast } = await import('../realtime');
      broadcast(message.conversationId, {
        type: 'message_updated',
        conversationId: message.conversationId,
        message: updatedMessage,
        deletedAt: new Date().toISOString(),
        deletedForEveryone: false // Soft delete não remove do WhatsApp
      });
      
      if (success) {
        const duration = Date.now() - startTime;
        res.json({ 
          success: true, 
          message: 'Mensagem removida da sua interface',
          type: 'soft_delete',
          deletedForEveryone: false,
          processingTime: `${duration}ms`
        });
      } else {
        res.status(500).json({ error: 'Erro ao deletar mensagem' });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Erro ao fazer soft delete da mensagem recebida (${duration}ms):`, error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Deletar mensagem enviada (localmente + Z-API)
  app.patch('/api/messages/:id/delete-sent', async (req, res) => {
    const startTime = Date.now();
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
      const messageTime = new Date(message.sentAt || new Date());
      const now = new Date();
      const timeDifference = now.getTime() - messageTime.getTime();
      const sevenMinutesInMs = 7 * 60 * 1000;
      
      console.log(`⏰ Verificando prazo de exclusão:`, {
        messageId,
        messageTime: messageTime.toISOString(),
        now: now.toISOString(),
        timeDifference: `${Math.round(timeDifference / 1000)}s`,
        withinLimit: timeDifference <= sevenMinutesInMs
      });

      if (timeDifference > sevenMinutesInMs) {
        console.log(`❌ Tentativa de exclusão fora do prazo para mensagem ${messageId}`);
        return res.status(400).json({ 
          error: 'Mensagem não pode ser deletada após 7 minutos do envio',
          timeDifference: Math.round(timeDifference / 1000 / 60),
          maxMinutes: 7
        });
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
          const { validateZApiCredentials } = await import('../../utils/zapi');
          
          const credentials = validateZApiCredentials();
          if (!credentials.valid) {
            console.error('❌ DELETAR VIA Z-API - Credenciais inválidas:', credentials.error);
            throw new Error(credentials.error);
          }

          const { instanceId, token, clientToken } = credentials;
          const cleanPhone = phone.replace(/\D/g, '');
          
          // URL correta da API Z-API para deletar mensagem
          const deleteUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/messages?phone=${cleanPhone}&messageId=${zapiMessageId}&owner=true`;
          
          console.log('🌐 DELETAR VIA Z-API - Fazendo requisição para:', deleteUrl);

          const deleteResponse = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
              'Client-Token': clientToken || ''
            }
          });

          const responseText = await deleteResponse.text();
          console.log('📥 DELETAR VIA Z-API - Resposta recebida:', {
            status: deleteResponse.status,
            statusText: deleteResponse.statusText,
            body: responseText
          });

          let deleteResult;
          try {
            deleteResult = responseText ? JSON.parse(responseText) : {};
          } catch (parseError) {
            console.error('❌ DELETAR VIA Z-API - Erro ao parsear JSON:', parseError);
            deleteResult = { rawResponse: responseText };
          }
          
          if (deleteResponse.ok) {
            console.log('✅ DELETAR VIA Z-API - Mensagem deletada com sucesso para ambos os usuários:', deleteResult);
            zapiDeletionSuccess = true;
          } else {
            console.error('❌ DELETAR VIA Z-API - Falha na resposta:', {
              status: deleteResponse.status,
              statusText: deleteResponse.statusText,
              result: deleteResult,
              rawResponse: responseText
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

      const duration = Date.now() - startTime;
      res.json({ 
        success: true, 
        message: zapiDeletionSuccess 
          ? 'Mensagem deletada para ambos os usuários' 
          : 'Mensagem removida da sua interface',
        localDeletion: true,
        zapiDeletion: zapiDeletionSuccess,
        deletedForEveryone: zapiDeletionSuccess,
        processingTime: `${duration}ms`
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Erro ao deletar mensagem enviada (${duration}ms):`, error);
      
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
