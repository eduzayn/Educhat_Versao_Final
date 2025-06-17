import type { Express } from "express";
import { storage } from "../../storage/index";

export function registerChannelTestConnectionRoutes(app: Express) {
  // Test channel connection - REST: POST /api/channels/:id/test
  app.post('/api/channels/:id/test', async (req, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const channel = await storage.getChannel(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Canal não encontrado' });
      }

      // Testar conexão Z-API
      const { instanceId, token, clientToken } = channel;
      
      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Canal não possui credenciais Z-API configuradas' 
        });
      }
      
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/status`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Atualizar status do canal
      await storage.updateChannel(channelId, {
        isConnected: data.connected || false,
        connectionStatus: data.connected ? 'connected' : 'disconnected'
      });
      
      res.json({ 
        connected: data.connected || false,
        session: data.session || false,
        smartphoneConnected: data.smartphoneConnected || false
      });
      
    } catch (error) {
      console.error(`❌ Erro ao testar conexão do canal ${req.params.id}:`, error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 