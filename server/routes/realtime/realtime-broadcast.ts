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
    
    const broadcastData = {
      ...data,
      timestamp: new Date().toISOString(),
      roomClients: clientCount
    };
    
    // CORREÇÃO: Sempre usar broadcast global como fallback para garantir entrega
    if (clientCount > 0) {
      // Preferir sala específica quando há clientes conectados
      ioInstance.to(roomName).emit('broadcast_message', broadcastData);
      console.log(`✅ Broadcast enviado para sala específica ${roomName} (${clientCount} clientes)`);
    } else {
      // FALLBACK: Broadcast global quando sala está vazia
      ioInstance.emit('broadcast_message', {
        ...broadcastData,
        fallbackBroadcast: true,
        originalRoom: roomName
      });
      console.log(`🔄 Fallback: Broadcast global enviado para conversa ${conversationId} (sala vazia)`);
    }
    
    logger.socket('Broadcast enviado', {
      conversationId,
      type: data.type,
      room: roomName,
      clientCount,
      method: clientCount > 0 ? 'room-specific' : 'global-fallback'
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
    // CORREÇÃO: Broadcast global com namespace correto
    ioInstance.emit('broadcast_message', {
      ...data,
      timestamp: new Date().toISOString(),
      globalBroadcast: true
    });
    
    // Broadcast adicional para garantir que conversas sejam atualizadas
    if (data.type === 'new_message' || data.type === 'conversation_updated') {
      ioInstance.emit('conversation_list_update', {
        type: 'refresh_conversations',
        conversationId: data.conversationId,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`📡 [BROADCAST-ALL] Enviado globalmente: ${data.type} para conversa ${data.conversationId}`);
    logger.socket('Broadcast global enviado', { type: data.type });
  } catch (error) {
    logger.error('Erro ao fazer broadcast global', error);
  }
}