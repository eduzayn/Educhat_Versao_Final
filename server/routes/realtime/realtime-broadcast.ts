import { Server as SocketIOServer } from "socket.io";
import { logger } from "../../utils/logger";

let ioInstance: SocketIOServer | null = null;

// Cache local para evitar broadcasts duplicados
const broadcastCache = new Map<string, {
  data: any;
  timestamp: number;
  ttl: number;
}>();

// Debounce para consolidar broadcasts
const broadcastQueue = new Map<string, {
  data: any;
  timeout: NodeJS.Timeout;
}>();

export function setIOInstance(io: SocketIOServer) {
  ioInstance = io;
  logger.socket('Socket.IO instance configurada para broadcasting');
}

// Função para gerar chave de cache
function getCacheKey(type: string, conversationId?: number, userId?: number): string {
  return `${type}:${conversationId || 'global'}:${userId || 'all'}`;
}

// Função para verificar se dados são iguais (deep comparison simplificada)
function isDataEqual(data1: any, data2: any): boolean {
  return JSON.stringify(data1) === JSON.stringify(data2);
}

// Função para limpar cache expirado
function cleanupExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of broadcastCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      broadcastCache.delete(key);
    }
  }
}

// Limpar cache a cada 5 minutos
setInterval(cleanupExpiredCache, 5 * 60 * 1000);

// Broadcast consolidado com cache e debounce
export function broadcast(
  conversationId: number, 
  data: any, 
  options: {
    cache?: boolean;
    ttl?: number;
    debounce?: number;
    force?: boolean;
  } = {}
) {
  if (!ioInstance) {
    logger.warn('Socket.IO instance não configurada para broadcasting');
    return;
  }

  const {
    cache = true,
    ttl = 30000, // 30 segundos
    debounce = 100, // 100ms
    force = false
  } = options;

  const cacheKey = getCacheKey(data.type, conversationId);
  const now = Date.now();

  // Verificar cache se habilitado
  if (cache && !force) {
    const cached = broadcastCache.get(cacheKey);
    if (cached && now - cached.timestamp < cached.ttl) {
      if (isDataEqual(cached.data, data)) {
        logger.socket('Broadcast ignorado (cache hit)', {
          conversationId,
          type: data.type,
          cacheKey
        });
        return;
      }
    }
  }

  // Debounce para consolidar broadcasts similares
  if (debounce > 0) {
    const queued = broadcastQueue.get(cacheKey);
    if (queued) {
      clearTimeout(queued.timeout);
    }

    const timeout = setTimeout(() => {
      broadcastQueue.delete(cacheKey);
      executeBroadcast(conversationId, data, cache, ttl, now);
    }, debounce);

    broadcastQueue.set(cacheKey, { data, timeout });
    return;
  }

  executeBroadcast(conversationId, data, cache, ttl, now);
}

// Função interna para executar o broadcast
function executeBroadcast(
  conversationId: number,
  data: any,
  cache: boolean,
  ttl: number,
  timestamp: number
) {
  try {
    ioInstance!.to(`conversation:${conversationId}`).emit('broadcast_message', data);
    
    // Atualizar cache
    if (cache) {
      const cacheKey = getCacheKey(data.type, conversationId);
      broadcastCache.set(cacheKey, { data, timestamp, ttl });
    }

    logger.socket('Broadcast enviado', {
      conversationId,
      type: data.type,
      room: `conversation:${conversationId}`,
      cached: cache
    });
  } catch (error) {
    logger.error('Erro ao fazer broadcast', error);
  }
}

// Broadcast global consolidado
export function broadcastToAll(
  data: any,
  options: {
    cache?: boolean;
    ttl?: number;
    debounce?: number;
    force?: boolean;
  } = {}
) {
  if (!ioInstance) {
    logger.warn('Socket.IO instance não configurada para broadcasting');
    return;
  }

  const {
    cache = true,
    ttl = 30000,
    debounce = 100,
    force = false
  } = options;

  const cacheKey = getCacheKey(data.type);
  const now = Date.now();

  // Verificar cache se habilitado
  if (cache && !force) {
    const cached = broadcastCache.get(cacheKey);
    if (cached && now - cached.timestamp < cached.ttl) {
      if (isDataEqual(cached.data, data)) {
        logger.socket('Broadcast global ignorado (cache hit)', {
          type: data.type,
          cacheKey
        });
        return;
      }
    }
  }

  // Debounce para consolidar broadcasts similares
  if (debounce > 0) {
    const queued = broadcastQueue.get(cacheKey);
    if (queued) {
      clearTimeout(queued.timeout);
    }

    const timeout = setTimeout(() => {
      broadcastQueue.delete(cacheKey);
      executeGlobalBroadcast(data, cache, ttl, now);
    }, debounce);

    broadcastQueue.set(cacheKey, { data, timeout });
    return;
  }

  executeGlobalBroadcast(data, cache, ttl, now);
}

// Função interna para executar broadcast global
function executeGlobalBroadcast(
  data: any,
  cache: boolean,
  ttl: number,
  timestamp: number
) {
  try {
    ioInstance!.emit('broadcast_message', data);
    
    // Atualizar cache
    if (cache) {
      const cacheKey = getCacheKey(data.type);
      broadcastCache.set(cacheKey, { data, timestamp, ttl });
    }

    logger.socket('Broadcast global enviado', { 
      type: data.type,
      cached: cache
    });
  } catch (error) {
    logger.error('Erro ao fazer broadcast global', error);
  }
}

// Broadcast consolidado para múltiplas conversas
export function broadcastToMultiple(
  conversationIds: number[],
  data: any,
  options: {
    cache?: boolean;
    ttl?: number;
    debounce?: number;
    force?: boolean;
  } = {}
) {
  if (!ioInstance) {
    logger.warn('Socket.IO instance não configurada para broadcasting');
    return;
  }

  const {
    cache = true,
    ttl = 30000,
    debounce = 100,
    force = false
  } = options;

  // Agrupar conversas por tipo de broadcast para otimização
  const conversationGroups = new Map<string, number[]>();
  
  conversationIds.forEach(id => {
    const cacheKey = getCacheKey(data.type, id);
    if (!conversationGroups.has(cacheKey)) {
      conversationGroups.set(cacheKey, []);
    }
    conversationGroups.get(cacheKey)!.push(id);
  });

  // Executar broadcasts consolidados
  conversationGroups.forEach((ids, cacheKey) => {
    const consolidatedData = {
      ...data,
      conversationIds: ids
    };

    if (debounce > 0) {
      const queued = broadcastQueue.get(cacheKey);
      if (queued) {
        clearTimeout(queued.timeout);
      }

      const timeout = setTimeout(() => {
        broadcastQueue.delete(cacheKey);
        executeMultipleBroadcast(ids, consolidatedData, cache, ttl, Date.now());
      }, debounce);

      broadcastQueue.set(cacheKey, { data: consolidatedData, timeout });
    } else {
      executeMultipleBroadcast(ids, consolidatedData, cache, ttl, Date.now());
    }
  });
}

// Função interna para executar broadcast múltiplo
function executeMultipleBroadcast(
  conversationIds: number[],
  data: any,
  cache: boolean,
  ttl: number,
  timestamp: number
) {
  try {
    // Enviar para todas as salas de uma vez
    conversationIds.forEach(id => {
      ioInstance!.to(`conversation:${id}`).emit('broadcast_message', data);
    });
    
    // Atualizar cache para cada conversa
    if (cache) {
      conversationIds.forEach(id => {
        const cacheKey = getCacheKey(data.type, id);
        broadcastCache.set(cacheKey, { data, timestamp, ttl });
      });
    }

    logger.socket('Broadcast múltiplo enviado', {
      conversationIds,
      type: data.type,
      count: conversationIds.length,
      cached: cache
    });
  } catch (error) {
    logger.error('Erro ao fazer broadcast múltiplo', error);
  }
}

// Função para limpar cache específico
export function clearBroadcastCache(type?: string, conversationId?: number) {
  if (type) {
    const cacheKey = getCacheKey(type, conversationId);
    broadcastCache.delete(cacheKey);
    logger.socket('Cache de broadcast limpo', { cacheKey });
  } else {
    broadcastCache.clear();
    logger.socket('Cache de broadcast limpo completamente');
  }
}

// Função para obter estatísticas do cache
export function getBroadcastCacheStats() {
  return {
    cacheSize: broadcastCache.size,
    queueSize: broadcastQueue.size,
    cacheKeys: Array.from(broadcastCache.keys()),
    queueKeys: Array.from(broadcastQueue.keys())
  };
}