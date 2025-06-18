import { Server as SocketIOServer } from "socket.io";

let ioInstance: SocketIOServer | null = null;

export function setIOInstance(io: SocketIOServer) {
  ioInstance = io;
  console.log('📡 Socket.IO instance configurada para broadcasting');
}

export function broadcast(conversationId: number, data: any) {
  if (!ioInstance) {
    console.warn('⚠️ Socket.IO instance não configurada para broadcasting');
    return;
  }

  try {
    // Broadcast para todos os clientes na sala da conversa
    ioInstance.to(`conversation:${conversationId}`).emit('broadcast_message', data);
    
    console.log('📡 Broadcast enviado:', {
      conversationId,
      type: data.type,
      room: `conversation:${conversationId}`
    });
  } catch (error) {
    console.error('❌ Erro ao fazer broadcast:', error);
  }
}

export function broadcastToAll(data: any) {
  if (!ioInstance) {
    console.warn('⚠️ Socket.IO instance não configurada para broadcasting');
    return;
  }

  try {
    ioInstance.emit('broadcast_message', data);
    console.log('📡 Broadcast global enviado:', { type: data.type });
  } catch (error) {
    console.error('❌ Erro ao fazer broadcast global:', error);
  }
}