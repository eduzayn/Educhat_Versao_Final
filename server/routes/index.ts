
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth/auth";

// Import all working routes
import { registerAuthRoutes } from "./auth/index";
import { registerWebhookRoutes } from "./webhooks/index";
import { registerAdminRoutes } from "./admin/index";
import { registerMediaRoutes } from "./media/index";
import { registerInboxRoutes } from "./inbox/index";
import { registerMessageRoutes } from "./messages/index";
import { registerContactRoutes } from "./contacts/index";
import { registerUserRoutes } from "./users/index";
import { registerChannelRoutes } from "./channels/index";
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
import { registerConversationDetailsRoutes } from "./conversations/details";
import { registerTeamsIntegratedChatRoutes } from "./internal-chat/teams-integration";

// Import router-based routes
import iaRouter from "./ia/index";
import iaMemoryRouter from "./ia/memory";
import documentsRouter from "./documents/index";
import webCaptureRouter from "./web-capture/index";
import aiConfigRouter from "./ai-config/index";
import handoffsRouter from "./handoffs/index";
import dashboardRouter from "./dashboard/index";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication first
  setupAuth(app);
  
  // Register critical webhook routes first
  registerWebhookRoutes(app);
  
  // Register authentication routes
  registerAuthRoutes(app);
  
  // Register administrative routes
  registerAdminRoutes(app);
  
  // Register core system routes
  registerMediaRoutes(app);
  registerInboxRoutes(app);
  registerMessageRoutes(app);
  registerContactRoutes(app);
  registerUserRoutes(app);
  registerChannelRoutes(app);
  registerConversationDetailsRoutes(app);
  
  // Register business logic routes
  registerDealsRoutes(app);
  registerAnalyticsRoutes(app);
  registerTeamsRoutes(app);
  registerQuickRepliesRoutes(app);
  registerUtilitiesRoutes(app);
  registerBIRoutes(app);
  registerSalesRoutes(app);
  registerCourseRoutes(app);
  registerIntegrationRoutes(app);
  registerFunnelRoutes(app);
  registerTeamsIntegratedChatRoutes(app);

  // Register router-based routes
  app.use('/api/ia', iaRouter);
  app.use('/api/ia', iaMemoryRouter);
  app.use('/api/ia', aiConfigRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/web-capture', webCaptureRouter);
  app.use('/api/handoffs', handoffsRouter);
  app.use('/api/dashboard', dashboardRouter);

  // Configure Socket.IO and return server
  const httpServer = registerRealtimeConfig(app);
  return httpServer;
}
