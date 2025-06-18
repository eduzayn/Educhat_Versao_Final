import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuthWithRoutes } from "./auth";

// Import modular routes
// registerAuthRoutes removed - now unified with setupAuthWithRoutes
import { registerAdminRoutes } from "./admin/index";
// Teams integration routes temporarily disabled for compilation
import { registerMediaRoutes } from "./media/index";
import { registerInboxRoutes } from "./inbox/index";
import { registerMessageRoutes } from "./messages/index";
import { registerContactRoutes } from "./contacts/index";
import { registerUserRoutes } from "./users/index";
import { registerChannelRoutes } from "./channels/index";
import { registerWebhookRoutes, assignTeamManually } from "./webhooks/index";
import { registerRealtimeConfig } from "./realtime/index";
import dealsRouter from "./deals/index";
import { registerAnalyticsRoutes } from "./analytics";
import { registerTeamsRoutes } from "./teams/index";
import { registerUserTeamsRoutes } from "./user-teams/index";
import { registerQuickRepliesRoutes } from "./quick-replies/index";
import { registerUtilitiesRoutes } from "./utilities/index";
import { registerBIRoutes } from "./bi";
import { registerSalesRoutes } from "./sales/index";
import { registerCourseRoutes } from "./courses/index";
import { registerIntegrationRoutes } from "./integrations/index";
import { registerSettingsRoutes } from "./settings/index";
import { registerFunnelRoutes } from "./funnels/index";
import { registerConversationDetailsRoutes } from "./conversations/details";
import { setupSearchRoutes } from "./search";
import conversationsRouter from "./conversations/index";
// Teams are now managed through dedicated team management system
import iaRouter from "./ia/index";
import iaMemoryRouter from "./ia/memory";
import documentsRouter from "./documents/index";
import webCaptureRouter from "./web-capture/index";

import handoffsRouter from "./handoffs/index";
import dashboardRouter from "./dashboard/index";
import { registerNotificationRoutes } from "./notifications/index";
import { registerTeamsIntegratedChatRoutes } from "./internal-chat/index";
import internalNotesRouter from "./internal-notes/index";
import reportsRouter from "./reports";
import activitiesRouter from "./activities/index";
import { registerUnifiedStatsRoutes } from "./stats/index";
import gamificationRouter from "./gamification";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup do sistema de autenticação consolidado PRIMEIRO
  setupAuthWithRoutes(app);
  
  // Registrar rotas críticas de webhook PRIMEIRO para evitar interceptação pelo Vite
  registerWebhookRoutes(app);
  
  // Authentication routes now integrated in setupAuthWithRoutes
  registerAdminRoutes(app);
  // registerTeamsIntegratedChatRoutes(app); // Temporarily disabled
  registerMediaRoutes(app);
  registerInboxRoutes(app);
  registerMessageRoutes(app);
  registerContactRoutes(app);
  registerUserRoutes(app);
  registerChannelRoutes(app);
  registerConversationDetailsRoutes(app);
  // Registrar rotas de atribuição manual para conversas (complementares às do inbox)
  app.use('/api/conversations', conversationsRouter);
  app.use('/api/deals', dealsRouter);
  registerAnalyticsRoutes(app);
  registerTeamsRoutes(app);
  registerUserTeamsRoutes(app);
  registerQuickRepliesRoutes(app);
  registerUtilitiesRoutes(app);
  registerBIRoutes(app);
  registerSalesRoutes(app);
  registerCourseRoutes(app);
  registerIntegrationRoutes(app);
  registerSettingsRoutes(app);
  registerFunnelRoutes(app);
  // Rotas de busca global
  setupSearchRoutes(app);
  // Sistema de detecção migrado para IA com equipes unificadas
  app.use('/api/ia', iaRouter);
  app.use('/api/ia', iaMemoryRouter);
  // Removido aiConfigRouter - agora consolidado em /api/settings/integrations/ai/config
  app.use('/api/documents', documentsRouter);
  app.use('/api/web-capture', webCaptureRouter);
  app.use('/api/handoffs', handoffsRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api', internalNotesRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/activities', activitiesRouter);
  registerNotificationRoutes(app);
  registerTeamsIntegratedChatRoutes(app);
  
  // Registrar rotas de gamificação
  app.use('/api/gamification', gamificationRouter);
  
  // Registrar rotas unificadas de estatísticas
  registerUnifiedStatsRoutes(app);

  // Registrar rotas de email
  const emailRouter = await import('./emails/index');
  app.use('/api/emails', emailRouter.default);

  // Registrar rotas de contatos para email
  const contactEmailRouter = await import('./contacts/email-list');
  app.use('/api/contacts/email-list', contactEmailRouter.default);

  // Registrar rotas de grupos de contatos
  const contactGroupsRouter = await import('./contact-groups/index');
  app.use('/api/contact-groups', contactGroupsRouter.default);

  // Registrar rotas de configuração de APIs
  const apisRouter = await import('./settings/apis');
  app.use('/api/settings/integrations/apis', apisRouter.default);

  // Configurar Socket.IO e retornar servidor
  const httpServer = registerRealtimeConfig(app);

  return httpServer;
}