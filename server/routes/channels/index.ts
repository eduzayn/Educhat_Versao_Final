import type { Express } from "express";
import { registerChannelListRoutes } from './list';
import { registerChannelCreateRoutes } from './create';
import { registerChannelUpdateRoutes } from './update';
import { registerChannelDeleteRoutes } from './delete';

export function registerChannelRoutes(app: Express) {
  registerChannelListRoutes(app);
  registerChannelCreateRoutes(app);
  registerChannelUpdateRoutes(app);
  registerChannelDeleteRoutes(app);
  console.log("Channel routes registered");
}