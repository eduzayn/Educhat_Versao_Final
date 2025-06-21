import type { Express } from "express";
import { registerChannelListRoutes } from './list';
import { registerChannelCreateRoutes } from './create';
import { registerChannelUpdateRoutes } from './update';
import { registerChannelDeleteRoutes } from './delete';
import { handleGetChannelQRCode } from '../webhooks/webhooks-qrcode';

export function registerChannelRoutes(app: Express) {
  registerChannelListRoutes(app);
  registerChannelCreateRoutes(app);
  registerChannelUpdateRoutes(app);
  registerChannelDeleteRoutes(app);
  
  // QR Code route for channels
  app.get('/api/channels/:id/qrcode', handleGetChannelQRCode);
  
  console.log("Channel routes registered");
}