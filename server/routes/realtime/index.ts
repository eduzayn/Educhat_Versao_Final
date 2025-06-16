import type { Express } from "express";
import { type Server } from "http";
import { createSocketServer } from './realtime-server';
import { setupSocketHandlers } from './realtime-handlers';
import { broadcast, broadcastToAll } from './realtime-broadcast';

export function registerRealtimeConfig(app: Express): Server {
  const httpServer = createSocketServer(app);
  setupSocketHandlers(httpServer.io);
  return httpServer;
}

export { broadcast, broadcastToAll };
