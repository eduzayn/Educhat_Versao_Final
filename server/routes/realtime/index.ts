import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "../../storage";

let io: SocketIOServer;

export function registerRealtimeConfig(app: Express): Server {
  const httpServer = createServer(app);

  // Socket.IO server for real-time communication with enhanced features
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? [
            'https://educhat.com.br', 
            'https://www.educhat.com.br',
            ...(process.env.RENDER_EXTERNAL_URL ? [process.env.RENDER_EXTERNAL_URL] : [])
          ]
        : '*',
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    connectTimeout: 45000,
    maxHttpBufferSize: 5e6 // 5MB
  });

  // Store connected clients with their metadata
  const clients = new Map<string, { 
    contactId?: number; 
    conversationId?: number; 
    socketId: string;
    connectedAt: number;
  }>();

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

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Cliente ${socket.id} desconectado: ${reason}`);
      clients.delete(socket.id);
    });
  });

  return httpServer;
}

// Broadcast function to send messages to clients in a specific conversation using Socket.IO
export function broadcast(conversationId: number, message: any, excludeSocketId?: string) {
  if (!io) return;
  
  const roomName = `conversation:${conversationId}`;
  if (excludeSocketId) {
    io.to(roomName).except(excludeSocketId).emit('broadcast_message', message);
  } else {
    io.to(roomName).emit('broadcast_message', message);
  }
}

export function broadcastToAll(message: any, excludeSocketId?: string) {
  if (!io) return;
  
  if (excludeSocketId) {
    io.except(excludeSocketId).emit('broadcast_message', message);
  } else {
    io.emit('broadcast_message', message);
  }
}