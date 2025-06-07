import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "../auth";
import { registerAdminRoutes } from "../admin-routes";
import { registerInternalChatRoutes } from "../internal-chat-routes";
import { registerMediaRoutes } from "../media-routes";

// Import modular routes
import { registerAuthRoutes } from "./auth/index";
import { registerInboxRoutes } from "./inbox/index";
import { registerMessageRoutes } from "./messages/index";
import { registerContactRoutes } from "./contacts/index";
import { registerUserRoutes } from "./users/index";
import { registerChannelRoutes } from "./channels/index";
import { registerWebhookRoutes } from "./webhooks/index";
import { registerRealtimeConfig } from "./realtime/index";

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