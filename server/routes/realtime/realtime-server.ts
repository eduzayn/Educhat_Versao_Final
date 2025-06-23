import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer;

interface SocketServer extends Server {
  io: SocketIOServer;
}

export function createSocketServer(app: Express): SocketServer {
  const httpServer = createServer(app) as SocketServer;

  // Socket.IO server - PRODUÇÃO OTIMIZADA para Replit
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isReplit = process.env.REPLIT_DEPLOYMENT_ID || process.env.REPL_ID;
  
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: isDevelopment ? ["http://localhost:5000", "http://127.0.0.1:5000"] : "*",
      methods: ["GET", "POST"],
      credentials: false,
      allowedHeaders: ["Content-Type", "Connection", "Upgrade"]
    },
    // Forçar WebSocket em produção para evitar transport errors
    transports: isReplit ? ['websocket'] : ['websocket', 'polling'],
    allowUpgrades: false, // Desabilitar upgrades para evitar instabilidades
    upgradeTimeout: 10000,
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    serveClient: false,
    cookie: false,
    // Configurações de estabilidade para WebSocket
    allowEIO3: false,
    connectTimeout: 30000,
    // Headers específicos para WebSocket
    allowRequest: (req, callback) => {
      // Validar headers de WebSocket
      const isWebSocket = req.headers.upgrade === 'websocket' || 
                         req.headers.connection?.toLowerCase().includes('upgrade');
      if (isReplit && !isWebSocket) {
        return callback('WebSocket required in production', false);
      }
      callback(null, true);
    }
  });

  httpServer.io = io;
  return httpServer;
}

export function getIO(): SocketIOServer {
  return io;
} 