import type { Express } from "express";
import { storage } from "../../storage/index";

export function registerChannelUpdateRoutes(app: Express) {
  // Update channel - REST: PUT /api/channels/:id
  app.put('/api/channels/:id', async (req, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const channelData = req.body;
      
      const channel = await storage.updateChannel(channelId, channelData);
      
      if (!channel) {
        return res.status(404).json({ error: 'Canal não encontrado' });
      }
      
      res.json(channel);
    } catch (error) {
      console.error('❌ Erro ao atualizar canal:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 