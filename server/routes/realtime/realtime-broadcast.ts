import { Server as SocketIOServer } from "socket.io";
import { logger } from "../../utils/logger";

let ioInstance: SocketIOServer | null = null;

export function setIOInstance(io: SocketIOServer) {
  ioInstance = io;
  logger.socket('Socket.IO instance configurada para broadcasting');
}

export function broadcast(conversationId: number, data: any) {
  if (!ioInstance) {
    logger.warn('Socket.IO instance não configurada para broadcasting');
    return;
  }

  try {
    const roomName = `conversation:${conversationId}`;
    const roomClients = ioInstance.sockets.adapter.rooms.get(roomName);
    const clientCount = roomClients ? roomClients.size : 0;
    
    console.log(`📡 Enviando broadcast para conversa ${conversationId}: ${clientCount} clientes conectados`);
    
    // Broadcast para sala específica
    ioInstance.to(roomName).emit('broadcast_message', {
      ...data,
      timestamp: new Date().toISOString(),
      roomClients: clientCount
    });
    
    logger.socket('Broadcast enviado', {
      conversationId,
      type: data.type,
      room: roomName,
      clientCount
    });
    
    // Log detalhado para debug
    if (clientCount === 0) {
      console.warn(`⚠️ Nenhum cliente na sala ${roomName} - broadcast pode não ter efeito`);
    }
    
  } catch (error) {
    logger.error('Erro ao fazer broadcast', error);
  }
}

export function broadcastToAll(data: any) {
  if (!ioInstance) {
    logger.warn('Socket.IO instance não configurada para broadcasting');
    return;
  }

  try {
    ioInstance.emit('broadcast_message', data);
    logger.socket('Broadcast global enviado', { type: data.type });
  } catch (error) {
    logger.error('Erro ao fazer broadcast global', error);
  }
}