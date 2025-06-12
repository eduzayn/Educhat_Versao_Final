import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth/auth";

// Import core working routes
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication first
  setupAuth(app);
  
  // Register critical webhook routes first
  registerWebhookRoutes(app);
  
  // Register core routes
  registerAuthRoutes(app);
  registerAdminRoutes(app);
  registerMediaRoutes(app);
  registerInboxRoutes(app);
  registerMessageRoutes(app);
  registerContactRoutes(app);
  registerUserRoutes(app);
  registerChannelRoutes(app);

  // Configure Socket.IO and return server
  const httpServer = registerRealtimeConfig(app);
  return httpServer;
}