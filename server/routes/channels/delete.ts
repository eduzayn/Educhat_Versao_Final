import type { Express } from "express";
import { storage } from "../storage";

export function registerChannelDeleteRoutes(app: Express) {
  // Delete channel - REST: DELETE /api/channels/:id
  app.delete('/api/channels/:id', async (req, res) => {
    try {
      const channelId = parseInt(req.params.id);
      await storage.deleteChannel(channelId);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao excluir canal:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 