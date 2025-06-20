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
  
  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado via Socket.IO: ${socket.id}`);
    clients.set(socket.id, { 
      socketId: socket.id, 
      connectedAt: Date.now() 
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
          isFromContact,
        });
        
        // Broadcast to all clients in the conversation
        io.to(`conversation:${conversationId}`).emit('new_message', {
          message: newMessage,
          conversationId
        });
      } catch (error) {
        console.error('Erro ao processar mensagem Socket.IO:', error);
        socket.emit('error', { message: 'Erro ao enviar mensagem' });
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