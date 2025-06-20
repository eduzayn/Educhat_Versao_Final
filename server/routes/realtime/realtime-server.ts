import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer;

interface SocketServer extends Server {
  io: SocketIOServer;
}

export function createSocketServer(app: Express): SocketServer {
  const httpServer = createServer(app) as SocketServer;

  // Socket.IO server for real-time communication - Production optimized
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: true, // Allow all origins to avoid CORS issues in production
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["*"]
    },
    // FORÇAR APENAS POLLING para máxima compatibilidade
    transports: ['polling'],
    allowUpgrades: false,
    // Timeouts otimizados para produção
    pingTimeout: 120000,      // 2 min timeout
    pingInterval: 30000,      // 30s ping
    upgradeTimeout: 30000,    // 30s timeout upgrade
    connectTimeout: 60000,    // 1 min conexão
    maxHttpBufferSize: 5e6,   // 5MB buffer
    // Configurações de produção
    serveClient: false,
    cookie: {
      name: "io",
      httpOnly: false,
      sameSite: "none",
      secure: false
    },
    compression: true,
    allowEIO3: true,          // Allow older clients
    destroyUpgrade: false,    // Don't destroy upgrades
    destroyUpgradeTimeout: 1000
  });

  httpServer.io = io;
  return httpServer;
}

export function getIO(): SocketIOServer {
  return io;
} 