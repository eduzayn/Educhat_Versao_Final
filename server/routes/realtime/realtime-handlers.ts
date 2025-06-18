import { Server as SocketIOServer } from "socket.io";
import { storage } from "../../storage/index";

// Store connected clients with their metadata
const clients = new Map<string, { 
  contactId?: number; 
  conversationId?: number; 
  socketId: string;
  connectedAt: number;
}>();

export function setupSocketHandlers(io: SocketIOServer) {
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

    // Handle new messages
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, isFromContact = false } = data;
        
        const newMessage = await storage.createMessage({
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

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Cliente ${socket.id} desconectado: ${reason}`);
      clients.delete(socket.id);
    });
  });
} 