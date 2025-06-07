import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "../auth";

// Import modular routes
import { registerAuthRoutes } from "./auth/index";
import { registerAdminRoutes } from "./admin/index";
import { registerInternalChatRoutes } from "./internal-chat/index";
import { registerMediaRoutes } from "./media/index";
import { registerInboxRoutes } from "./inbox/index";
import { registerMessageRoutes } from "./messages/index";
import { registerContactRoutes } from "./contacts/index";
import { registerUserRoutes } from "./users/index";
import { registerChannelRoutes } from "./channels/index";
import { registerWebhookRoutes } from "./webhooks/index";
import { registerRealtimeConfig } from "./realtime/index";
import { registerDealsRoutes } from "./deals/index";
import { registerAnalyticsRoutes } from "./analytics/index";
import { registerTeamsRoutes } from "./teams/index";
import { registerQuickRepliesRoutes } from "./quick-replies/index";
import { registerUtilitiesRoutes } from "./utilities/index";
import { registerBIRoutes } from "./bi/index";
import { registerSalesRoutes } from "./sales/index";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup do sistema de autenticação próprio
  setupAuth(app);
  
  // Registrar todos os módulos extraídos
  registerAuthRoutes(app);
  registerAdminRoutes(app);
  registerInternalChatRoutes(app);
  registerMediaRoutes(app);
  registerInboxRoutes(app);
  registerMessageRoutes(app);
  registerContactRoutes(app);
  registerUserRoutes(app);
  registerChannelRoutes(app);
  registerWebhookRoutes(app);
  registerDealsRoutes(app);
  registerAnalyticsRoutes(app);
  registerTeamsRoutes(app);
  registerQuickRepliesRoutes(app);
  registerUtilitiesRoutes(app);
  registerBIRoutes(app);
  registerSalesRoutes(app);

  // Configurar Socket.IO e retornar servidor
  const httpServer = registerRealtimeConfig(app);

  return httpServer;
}