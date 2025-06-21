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
      allowedHeaders: ["Content-Type"]
    },
    // SOLUÇÃO xhr poll error: WebSocket apenas em produção Replit
    transports: isReplit ? ['websocket'] : ['polling', 'websocket'],
    allowUpgrades: false, // Evitar upgrade que causa xhr poll error
    upgradeTimeout: 30000,
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    serveClient: false,
    cookie: false,
    // Configurações específicas para polling no Replit
    allowEIO3: true
  });

  httpServer.io = io;
  return httpServer;
}

export function getIO(): SocketIOServer {
  return io;
} 