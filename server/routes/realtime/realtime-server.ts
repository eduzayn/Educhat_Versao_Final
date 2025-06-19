import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer;

interface SocketServer extends Server {
  io: SocketIOServer;
}

export function createSocketServer(app: Express): SocketServer {
  const httpServer = createServer(app) as SocketServer;

  // Socket.IO server com configurações otimizadas para baixa latência
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? [
            'https://educhat.com.br', 
            'https://www.educhat.com.br',
            'https://educhat.galaxiasistemas.com.br',
            ...(process.env.RENDER_EXTERNAL_URL ? [process.env.RENDER_EXTERNAL_URL] : [])
          ]
        : '*',
      methods: ["GET", "POST"],
      credentials: true
    },
    // Configurações otimizadas para baixa latência
    pingTimeout: 10000,        // 10 segundos para timeout
    pingInterval: 5000,        // 5 segundos para ping
    upgradeTimeout: 5000,      // 5 segundos para upgrade
    connectTimeout: 10000,     // 10 segundos para conexão
    transports: ['websocket'], // Forçar WebSocket para melhor performance
    maxHttpBufferSize: 1e6,    // 1MB (reduzido para otimização)
    // Configurações adicionais para estabilidade
    allowUpgrades: true,
    serveClient: false,
    cookie: false,
    // Configurações de reconexão
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // Otimizações de buffer
    perMessageDeflate: {
      threshold: 1024, // Comprimir apenas mensagens maiores que 1KB
      zlibInflateOptions: {
        chunkSize: 10 * 1024 // 10KB
      },
      zlibDeflateOptions: {
        level: 6 // Nível de compressão balanceado
      }
    }
  });

  httpServer.io = io;
  
  // Log de diagnóstico
  io.engine.on("connection_error", (err) => {
    console.error("❌ Erro de conexão Socket.IO:", {
      type: err.type,
      description: err.description,
      context: err.context
    });
  });

  return httpServer;
}

export function getIO(): SocketIOServer {
  return io;
} 