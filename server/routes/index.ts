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
import notificationPreferencesRoutes from "./notification-preferences/index";
import { registerLazyLoadingRoutes } from "./conversations/lazy-loading";
import userTagsRoutes from "./user-tags/index";


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
  registerLazyLoadingRoutes(app);

  // Registrar rotas de preferências de notificação
  app.use('/api/notification-preferences', notificationPreferencesRoutes);

  // Registrar rotas de tags de usuário
  app.use('/api/user-tags', userTagsRoutes);

  // Registrar rotas de keyword routing
  app.use('/api/keyword-routing', (await import('./keywordRouting/index.js')).default);

  // Configurar Socket.IO e retornar servidor
  const httpServer = registerRealtimeConfig(app);

  return httpServer;
}