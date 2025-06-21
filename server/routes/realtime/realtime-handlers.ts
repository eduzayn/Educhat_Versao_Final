import { Server as SocketIOServer } from "socket.io";
import { storage } from "../../storage/index";
import { setIOInstance } from './realtime-broadcast';

// Store connected clients with their metadata
const clients = new Map<string, { 
  contactId?: number; 
  conversationId?: number; 
  socketId: string;
  connectedAt: number;
}>();

export function setupSocketHandlers(io: SocketIOServer) {
  // Configurar instância do Socket.IO para broadcasting
  setIOInstance(io);
  
  // Logging específico para produção
  const isProduction = process.env.NODE_ENV === 'production';
  const isReplit = process.env.REPLIT_DEPLOYMENT_ID || process.env.REPL_ID;
  
  if (isProduction && isReplit) {
    console.log('🔌 [PRODUÇÃO] Socket.IO configurado para Replit:', {
      transports: io.engine.transports,
      cors: io.engine.opts.cors,
      allowUpgrades: io.engine.opts.allowUpgrades
    });
  }
  
  io.on('connection', (socket) => {
    const transport = socket.conn.transport.name;
    console.log(`🔌 Cliente conectado via Socket.IO: ${socket.id} (${transport})`);
    
    clients.set(socket.id, { 
      socketId: socket.id, 
      connectedAt: Date.now() 
    });
    
    // Log transport upgrades em produção
    socket.conn.on('upgrade', () => {
      const newTransport = socket.conn.transport.name;
      console.log(`🔄 Transport upgrade: ${transport} → ${newTransport} (${socket.id})`);
    });
    
    socket.conn.on('upgradeError', (error) => {
      console.error(`❌ Upgrade error para ${socket.id}:`, error.message);
    });

    // Handle joining a conversation room
    socket.on('join_conversation', (data) => {
      const { conversationId } = data;
      const clientData = clients.get(socket.id);
      if (clientData) {
        clients.set(socket.id, { ...clientData, conversationId });
        socket.join(`conversation:${conversationId}`);
        console.log(`🏠 Cliente ${socket.id} entrou na conversa ${conversationId}`);
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { conversationId, isTyping } = data;
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        isTyping,
        socketId: socket.id
      });
    });

    // SOCKET-FIRST: Handle envio de mensagens em tempo real
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, messageType = 'text', isFromContact = false, isInternalNote = false, optimisticId } = data;
        
        console.log('📡 SOCKET-FIRST: Recebendo mensagem via WebSocket:', { conversationId, content, optimisticId });
        
        // Salvar mensagem no banco
        const newMessage = await storage.message.createMessage({
          conversationId,
          content,
          messageType,
          isFromContact,
          isInternalNote
        });
        
        console.log('📡 SOCKET-FIRST: Mensagem salva, broadcasting via WebSocket:', newMessage.id);
        
        // SOCKET-FIRST: Broadcast para todos os clientes da conversa via WebSocket
        io.to(`conversation:${conversationId}`).emit('broadcast_message', {
          type: 'new_message',
          message: newMessage,
          conversationId,
          optimisticId // Para substituição de mensagem otimista
        });
        
        // Z-API em background para mensagens não internas
        if (!isInternalNote) {
          const conversation = await storage.conversation.getConversation(conversationId);
          if (conversation?.contact?.phone) {
            // Processar Z-API de forma assíncrona
            setImmediate(async () => {
              try {
                const response = await fetch(`${process.env.WEBHOOK_URL || 'http://localhost:5000'}/api/zapi/send-message`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    phone: conversation.contact.phone,
                    message: content,
                    conversationId: conversationId
                  })
                });
                console.log('📡 Z-API processado em background via WebSocket');
              } catch (error) {
                console.error('❌ Erro Z-API em background:', error);
              }
            });
          }
        }
      } catch (error) {
        console.error('❌ Erro ao processar mensagem Socket.IO:', error);
        // Enviar erro detalhado para debug em produção
        socket.emit('message_error', { 
          message: 'Erro ao enviar mensagem',
          error: error.message,
          optimisticId,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle conversation assignment updates
    socket.on('conversation_assignment_updated', (data) => {
      const { conversationId, assignedTeamId, assignedUserId, assignmentMethod } = data;
      
      // Broadcast assignment update to all clients in the conversation
      io.to(`conversation:${conversationId}`).emit('conversation_assignment_updated', {
        conversationId,
        assignedTeamId,
        assignedUserId,
        assignmentMethod,
        updatedAt: new Date().toISOString()
      });
    });

    // Handle disconnection with enhanced logging
    socket.on('disconnect', (reason) => {
      const clientData = clients.get(socket.id);
      const connectionDuration = clientData ? Date.now() - clientData.connectedAt : 0;
      
      console.log(`🔌 Cliente ${socket.id} desconectado: ${reason}`, {
        reason,
        duration: `${Math.round(connectionDuration / 1000)}s`,
        conversationId: clientData?.conversationId,
        wasInRoom: !!clientData?.conversationId
      });
      
      clients.delete(socket.id);
    });

    // Handle connection errors on server side
    socket.on('error', (error) => {
      console.error(`❌ Erro no socket ${socket.id}:`, error);
    });
  });
} 