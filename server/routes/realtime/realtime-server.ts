import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer;

interface SocketServer extends Server {
  io: SocketIOServer;
}

export function createSocketServer(app: Express): SocketServer {
  const httpServer = createServer(app) as SocketServer;

  // Socket.IO server for real-time communication with enhanced stability
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
    // Configurações otimizadas para prevenir timeouts - CORREÇÃO CRÍTICA
    pingTimeout: 60000,       // 60 segundos - aumentado para evitar timeout prematuro
    pingInterval: 25000,      // 25 segundos para heartbeat estável
    upgradeTimeout: 30000,    // 30 segundos para upgrade seguro
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    connectTimeout: 45000,    // 45 segundos para conexão robusta
    maxHttpBufferSize: 5e6,   // 5MB
    // Configurações adicionais para reconexão estável
    serveClient: false,
    allowUpgrades: true,
    cookie: false
  });

  httpServer.io = io;
  return httpServer;
}

export function getIO(): SocketIOServer {
  return io;
} 