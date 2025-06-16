import type { Express } from "express";
import { storage } from "../../storage";

export function registerChannelListRoutes(app: Express) {
  // Get all channels - REST: GET /api/channels
  app.get('/api/channels', async (req, res) => {
    try {
      const channels = await storage.getChannels();
      res.json(channels);
    } catch (error) {
      console.error('❌ Erro ao buscar canais:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Get channel by ID - REST: GET /api/channels/:id
  app.get('/api/channels/:id', async (req, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const channel = await storage.getChannel(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Canal não encontrado' });
      }
      
      res.json(channel);
    } catch (error) {
      console.error('❌ Erro ao buscar canal:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 