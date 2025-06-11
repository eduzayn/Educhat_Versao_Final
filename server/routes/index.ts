import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth/auth";

// Import modular routes
import { registerAuthRoutes } from "./auth/index";
import { registerAdminRoutes } from "./admin/index";
import { registerTeamsIntegratedChatRoutes } from "./internal-chat/teams-integration";
import { registerMediaRoutes } from "./media/index";
import { registerInboxRoutes } from "./inbox/index";
import { registerMessageRoutes } from "./messages/index";
import { registerContactRoutes } from "./contacts/index";
import { registerUserRoutes } from "./users/index";
import { registerChannelRoutes } from "./channels/index";
import { registerWebhookRoutes, registerZApiRoutes, registerFacebookWebhookRoutes } from "./webhooks/index";
import { registerRealtimeConfig } from "./realtime/index";
import { registerDealsRoutes } from "./deals/index";
import { registerAnalyticsRoutes } from "./analytics/index";
import { registerTeamsRoutes } from "./teams/index";
import { registerQuickRepliesRoutes } from "./quick-replies/index";
import { registerUtilitiesRoutes } from "./utilities/index";
import { registerBIRoutes } from "./bi/index";
import { registerSalesRoutes } from "./sales/index";
import { registerCourseRoutes } from "./courses/index";
import { registerIntegrationRoutes } from "./integrations/index";
import { registerFunnelRoutes } from "./funnels/index";
// import { registerMacrosetorRoutes } from "./settings/macrosetores"; // Removido - sistema migrado para IA
import iaRouter from "./ia/index";
import iaMemoryRouter from "./ia/memory";
import documentsRouter from "./documents/index";
import webCaptureRouter from "./web-capture/index";
import aiConfigRouter from "./ai-config/index";
import handoffsRouter from "./handoffs/index";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup do sistema de autenticação próprio PRIMEIRO
  setupAuth(app);
  
  // Registrar rotas críticas de webhook PRIMEIRO para evitar interceptação pelo Vite
  registerWebhookRoutes(app);
  registerZApiRoutes(app);
  registerFacebookWebhookRoutes(app);
  
  // Registrar rotas de autenticação após webhooks
  registerAuthRoutes(app);
  registerAdminRoutes(app);
  registerTeamsIntegratedChatRoutes(app);
  registerMediaRoutes(app);
  registerInboxRoutes(app);
  registerMessageRoutes(app);
  registerContactRoutes(app);
  registerUserRoutes(app);
  registerChannelRoutes(app);
  registerDealsRoutes(app);
  registerAnalyticsRoutes(app);
  registerTeamsRoutes(app);
  registerQuickRepliesRoutes(app);
  registerUtilitiesRoutes(app);
  registerBIRoutes(app);
  registerSalesRoutes(app);
  registerCourseRoutes(app);
  registerIntegrationRoutes(app);
  // registerMacrosetorRoutes(app, {} as any); // Removido - sistema migrado para IA
  app.use('/api/ia', iaRouter);
  app.use('/api/ia', iaMemoryRouter);
  app.use('/api/ia', aiConfigRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/web-capture', webCaptureRouter);
  app.use('/api/handoffs', handoffsRouter);

  // Configurar Socket.IO e retornar servidor
  const httpServer = registerRealtimeConfig(app);

  return httpServer;
}