import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "../auth";
import { registerAdminRoutes } from "../admin-routes";
import { registerInternalChatRoutes } from "../internal-chat-routes";
import { registerMediaRoutes } from "../media-routes";

// Import modular routes
import { registerAuthRoutes } from "./auth";
import { registerInboxRoutes } from "./inbox";
import { registerMessageRoutes } from "./messages";
import { registerContactRoutes } from "./contacts";
import { registerUserRoutes } from "./users";
import { registerChannelRoutes } from "./channels";
import { registerWebhookRoutes } from "./webhooks";
import { registerRealtimeConfig } from "./realtime";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup do sistema de autenticação próprio
  setupAuth(app);
  
  // Registrar rotas administrativas existentes
  registerAdminRoutes(app);
  registerInternalChatRoutes(app);
  registerMediaRoutes(app);

  // Registrar rotas modulares
  registerAuthRoutes(app);
  registerInboxRoutes(app);
  registerMessageRoutes(app);
  registerContactRoutes(app);
  registerUserRoutes(app);
  registerChannelRoutes(app);
  registerWebhookRoutes(app);

  // Configurar Socket.IO e retornar servidor
  const httpServer = registerRealtimeConfig(app);

  return httpServer;
}