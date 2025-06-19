import { Server as SocketIOServer } from "socket.io";
import { storage } from "../../storage/index";
import { setIOInstance, broadcast, broadcastToAll } from './realtime-broadcast';
import { logger } from "../../utils/logger";

interface ClientData {
  contactId?: number;
  conversationId?: number;
  socketId: string;
  connectedAt: number;
  lastActivity: number;
  messageQueue: any[];
}

// Store connected clients with their metadata
const clients = new Map<string, ClientData>();

// Cache local para evitar recarregamentos desnecessários
const conversationCache = new Map<number, {
  data: any;
  timestamp: number;
  ttl: number;
}>();

// Limpar clientes inativos periodicamente
setInterval(() => {
  const now = Date.now();
  clients.forEach((client, socketId) => {
    // Remove clientes inativos por mais de 5 minutos
    if (now - client.lastActivity > 5 * 60 * 1000) {
      clients.delete(socketId);
      logger.socket(`Cliente ${socketId} removido por inatividade`);
    }
  });
}, 60 * 1000); // Executa a cada minuto

// Limpar cache de conversas expirado
setInterval(() => {
  const now = Date.now();
  conversationCache.forEach((entry, key) => {
    if (now - entry.timestamp > entry.ttl) {
      conversationCache.delete(key);
    }
  });
}, 2 * 60 * 1000); // Executa a cada 2 minutos

export function setupSocketHandlers(io: SocketIOServer) {
  // Configurar instância do Socket.IO para broadcasting
  setIOInstance(io);
  
  io.on('connection', (socket) => {
    logger.socket(`🔌 Cliente conectado: ${socket.id}`);
    
    // Inicializar dados do cliente
    clients.set(socket.id, { 
      socketId: socket.id, 
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      messageQueue: []
    });

    // Atualizar timestamp de atividade
    const updateActivity = () => {
      const client = clients.get(socket.id);
      if (client) {
        client.lastActivity = Date.now();
      }
    };

    // Handle joining a conversation room
    socket.on('join_conversation', (data) => {
      updateActivity();
      const { conversationId } = data;
      const clientData = clients.get(socket.id);
      if (clientData) {
        clients.set(socket.id, { ...clientData, conversationId });
        socket.join(`conversation:${conversationId}`);
        logger.socket(`🏠 Cliente ${socket.id} entrou na conversa ${conversationId}`);
      }
    });

    // Handle typing indicators with debounce
    let typingTimeout: NodeJS.Timeout;
    socket.on('typing', (data) => {
      updateActivity();
      const { conversationId, isTyping } = data;
      
      // Limpar timeout anterior
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Enviar status de digitação com cache desabilitado (sempre atual)
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        isTyping,
        socketId: socket.id
      });

      // Definir timeout para parar o status de digitação
      if (isTyping) {
        typingTimeout = setTimeout(() => {
          socket.to(`conversation:${conversationId}`).emit('typing', {
            conversationId,
            isTyping: false,
            socketId: socket.id
          });
        }, 3000);
      }
    });

    // Handle new messages with optimistic updates
    socket.on('send_message', async (data) => {
      updateActivity();
      try {
        const { conversationId, content, messageType = 'text', tempId } = data;
        const clientData = clients.get(socket.id);
        
        if (!clientData) {
          socket.emit('message_error', { error: 'Cliente não autenticado' });
          return;
        }

        // Criar mensagem otimista
        const optimisticMessage = {
          id: tempId || Date.now(),
          conversationId,
          content,
          messageType,
          isFromContact: false,
          sentAt: new Date(),
          status: 'sending',
          tempId
        };

        // Broadcast otimista imediato (sem cache para mensagens)
        broadcast(conversationId, {
          type: 'new_message',
          message: optimisticMessage
        }, { cache: false, debounce: 0 });

        // Salvar mensagem no banco
        const savedMessage = await storage.messages.createMessage({
          conversationId,
          content,
          messageType,
          isFromContact: false,
          status: 'sent',
          tempId
        });

        // Broadcast da mensagem confirmada
        broadcast(conversationId, {
          type: 'message_confirmed',
          message: savedMessage,
          tempId
        }, { cache: false, debounce: 0 });

        // Atualizar lista de conversas
        broadcastToAll({
          type: 'conversation_list_update',
          action: 'message_sent',
          conversationId,
          message: savedMessage
        }, { debounce: 200 }); // Debounce para consolidar atualizações

        socket.emit('message_sent', { 
          success: true, 
          message: savedMessage,
          tempId 
        });

        logger.socket('Mensagem enviada com sucesso', {
          conversationId,
          messageId: savedMessage.id,
          tempId
        });

      } catch (error) {
        logger.error('Erro ao processar mensagem Socket.IO:', error);
        socket.emit('message_error', { 
          error: 'Erro ao enviar mensagem',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    });

    // Handle conversation updates
    socket.on('update_conversation', async (data) => {
      updateActivity();
      try {
        const { conversationId, updates } = data;
        
        // Atualizar conversa no banco
        const updatedConversation = await storage.conversation.updateConversation(
          conversationId,
          updates
        );

        // Broadcast da atualização com cache
        broadcast(conversationId, {
          type: 'conversation_updated',
          conversation: updatedConversation
        }, { debounce: 300 });

        // Atualizar cache local
        conversationCache.set(conversationId, {
          data: updatedConversation,
          timestamp: Date.now(),
          ttl: 60000 // 1 minuto
        });

        socket.emit('conversation_updated', { 
          success: true, 
          conversation: updatedConversation 
        });

      } catch (error) {
        logger.error('Erro ao atualizar conversa:', error);
        socket.emit('conversation_error', { 
          error: 'Erro ao atualizar conversa',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    });

    // Handle bulk operations
    socket.on('bulk_operation', async (data) => {
      updateActivity();
      try {
        const { operation, conversationIds, updates } = data;
        
        let results;
        switch (operation) {
          case 'mark_read':
            results = await Promise.all(
              conversationIds.map((id: number) => 
                storage.conversation.updateConversation(id, { isRead: true })
              )
            );
            break;
          case 'assign_user':
            results = await Promise.all(
              conversationIds.map((id: number) => 
                storage.conversation.updateConversation(id, updates)
              )
            );
            break;
          default:
            throw new Error(`Operação não suportada: ${operation}`);
        }

        // Broadcast consolidado para múltiplas conversas
        const { broadcastToMultiple } = await import('./realtime-broadcast');
        broadcastToMultiple(conversationIds, {
          type: 'bulk_operation_completed',
          operation,
          results
        }, { debounce: 500 });

        socket.emit('bulk_operation_completed', { 
          success: true, 
          operation,
          results 
        });

      } catch (error) {
        logger.error('Erro na operação em lote:', error);
        socket.emit('bulk_operation_error', { 
          error: 'Erro na operação em lote',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.socket(`🔌 Cliente desconectado: ${socket.id}`, { reason });
      clients.delete(socket.id);
    });
  });
} 