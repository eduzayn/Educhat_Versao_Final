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
    // Configuração otimizada para reduzir transport errors
    transports: ['websocket', 'polling'],
    allowUpgrades: true, // Permitir upgrade para melhor performance
    upgradeTimeout: 30000,
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    serveClient: false,
    cookie: false,
    // Configurações de estabilidade
    allowEIO3: true,
    connectTimeout: 45000,
    // Configurações para robustez em redes instáveis
    transports: isReplit ? ['websocket', 'polling'] : ['polling', 'websocket']
  });

  httpServer.io = io;
  return httpServer;
}

export function getIO(): SocketIOServer {
  return io;
} 