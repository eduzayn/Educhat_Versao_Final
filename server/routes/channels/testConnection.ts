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
      
      console.log(`🔍 Testando conexão canal ${channelId} - URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 segundos de timeout
      });

      console.log(`📡 Resposta Z-API: Status ${response.status}, Content-Type: ${response.headers.get('content-type')}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro Z-API Response: ${response.status} - ${errorText}`);
        
        // Retornar JSON de erro em vez de lançar exceção
        return res.status(500).json({
          connected: false,
          error: `Erro na API Z-API: ${response.status} - ${response.statusText}`,
          channelId: channelId
        });
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error(`❌ Resposta não é JSON: ${responseText.substring(0, 200)}`);
        
        // Retornar JSON de erro em vez de lançar exceção
        return res.status(500).json({
          connected: false,
          error: 'Resposta da Z-API não é JSON válido',
          channelId: channelId
        });
      }

      const data = await response.json();
      
      // Atualizar status do canal
      await storage.updateChannel(channelId, {
        isConnected: data.connected || false,
        connectionStatus: data.connected ? 'connected' : 'disconnected'
      });
      
      const result = { 
        connected: data.connected || false,
        session: data.session || false,
        smartphoneConnected: data.smartphoneConnected || false,
        channelId: channelId,
        status: data.connected ? 'connected' : 'disconnected',
        message: data.connected 
          ? 'WhatsApp conectado com sucesso' 
          : 'WhatsApp não conectado - use QR Code para conectar'
      };
      
      console.log(`✅ Teste de conexão canal ${channelId}:`, result);
      res.json(result);
      
    } catch (error) {
      console.error(`❌ Erro ao testar conexão do canal ${req.params.id}:`, error);
      res.status(500).json({ 
        connected: false,
        channelId: parseInt(req.params.id),
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
} 