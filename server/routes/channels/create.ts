import type { Express } from "express";
import { storage } from "../storage";

export function registerChannelCreateRoutes(app: Express) {
  // Create new channel - REST: POST /api/channels
  app.post('/api/channels', async (req, res) => {
    try {
      const channelData = req.body;
      const channel = await storage.createChannel(channelData);
      res.status(201).json(channel);
    } catch (error) {
      console.error('❌ Erro ao criar canal:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 