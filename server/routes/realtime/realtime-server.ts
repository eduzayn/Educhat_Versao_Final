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
    // Configurações otimizadas para tempo real - Socket-first como Chatwoot
    pingTimeout: 5000,        // 5s - resposta rápida para tempo real
    pingInterval: 2000,       // 2s - heartbeat frequente para responsividade
    upgradeTimeout: 5000,     // 5s - upgrade rápido para WebSocket
    transports: ['websocket', 'polling'], // WebSocket prioritário
    allowEIO3: true,
    connectTimeout: 10000,    // 10s - conexão rápida
    maxHttpBufferSize: 5e6,   // 5MB
    // Configurações para performance socket-first
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