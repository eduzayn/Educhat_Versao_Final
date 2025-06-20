import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer;

interface SocketServer extends Server {
  io: SocketIOServer;
}

export function createSocketServer(app: Express): SocketServer {
  const httpServer = createServer(app) as SocketServer;

  // Socket.IO server - MINIMAL CONFIG for Replit compatibility
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: false
    },
    transports: ['polling'],
    allowUpgrades: false,
    pingTimeout: 60000,
    pingInterval: 25000,
    serveClient: false,
    cookie: false
  });

  httpServer.io = io;
  return httpServer;
}

export function getIO(): SocketIOServer {
  return io;
} 