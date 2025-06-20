import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer;

interface SocketServer extends Server {
  io: SocketIOServer;
}

export function createSocketServer(app: Express): SocketServer {
  const httpServer = createServer(app) as SocketServer;

  // Socket.IO server for real-time communication - Chatwoot optimized
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
    // FORÇAR APENAS POLLING - Sem WebSocket
    transports: ['polling'],  // APENAS polling
    allowUpgrades: false,     // BLOQUEAR upgrades
    pingTimeout: 60000,       // 1 min timeout
    pingInterval: 25000,      // 25s ping
    upgradeTimeout: 1000,     // 1s timeout upgrade (impossível)
    connectTimeout: 45000,    // 45s conexão
    maxHttpBufferSize: 1e6,   // 1MB buffer
    // Configurações anti-WebSocket
    serveClient: false,
    cookie: false,
    compression: false,
    allowEIO3: false,
    destroyUpgrade: true,
    destroyUpgradeTimeout: 1
  });

  httpServer.io = io;
  return httpServer;
}

export function getIO(): SocketIOServer {
  return io;
} 