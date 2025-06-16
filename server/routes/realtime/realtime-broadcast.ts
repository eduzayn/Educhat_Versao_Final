import { getIO } from './realtime-server';

// Broadcast function to send messages to clients in a specific conversation using Socket.IO
export function broadcast(conversationId: number, message: any, excludeSocketId?: string) {
  const io = getIO();
  if (!io) return;
  
  const roomName = `conversation:${conversationId}`;
  if (excludeSocketId) {
    io.to(roomName).except(excludeSocketId).emit('broadcast_message', message);
  } else {
    io.to(roomName).emit('broadcast_message', message);
  }
}

export function broadcastToAll(message: any, excludeSocketId?: string) {
  const io = getIO();
  if (!io) return;
  
  if (excludeSocketId) {
    io.except(excludeSocketId).emit('broadcast_message', message);
  } else {
    io.emit('broadcast_message', message);
  }
} 