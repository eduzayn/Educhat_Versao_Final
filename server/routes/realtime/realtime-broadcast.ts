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
    ioInstance.to(`conversation:${conversationId}`).emit('broadcast_message', data);
    logger.socket('Broadcast enviado', {
      conversationId,
      type: data.type,
      room: `conversation:${conversationId}`
    });
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