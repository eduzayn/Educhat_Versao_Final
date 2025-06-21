import type { Express } from "express";
import { storage } from "../storage/index";

export function registerChannelRoutes(app: Express) {
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

  // Generate QR Code for channel - REST: GET /api/channels/:id/qrcode
  app.get('/api/channels/:id/qrcode', async (req, res) => {
    try {
      const channelId = parseInt(req.params.id);
      const channel = await storage.getChannel(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Canal não encontrado' });
      }

      const { instanceId, token, clientToken } = channel;
      
      if (!instanceId || !token || !clientToken) {
        return res.status(400).json({ 
          error: 'Canal não possui credenciais Z-API configuradas' 
        });
      }

      // Verificar status primeiro
      const statusUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/status`;
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken,
          'Content-Type': 'application/json'
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Erro ao obter status: ${statusResponse.status} - ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();
      
      // Se já está conectado e com sessão ativa
      if (statusData.connected && statusData.session) {
        return res.json({
          connected: true,
          session: true,
          message: 'WhatsApp já está conectado e com sessão ativa.',
          needsQrCode: false
        });
      }

      // Obter QR Code
      const qrUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/qr-code`;
      const qrResponse = await fetch(qrUrl, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken,
          'Content-Type': 'application/json'
        }
      });

      if (!qrResponse.ok) {
        throw new Error(`Erro ao obter QR Code: ${qrResponse.status} - ${qrResponse.statusText}`);
      }

      const qrData = await qrResponse.json();
      
      // Z-API retorna o QR Code no campo 'value'
      const qrCode = qrData.value;
      
      if (qrCode) {
        return res.json({ 
          connected: statusData.connected || false,
          session: statusData.session || false,
          qrCode: qrCode,
          needsQrCode: true,
          message: 'QR Code disponível. Escaneie rapidamente com seu WhatsApp para conectar.',
          instructions: 'Abra o WhatsApp > Menu (3 pontos) > Dispositivos conectados > Conectar dispositivo'
        });
      }

      // Fallback se não conseguir obter QR Code
      res.status(400).json({
        connected: statusData.connected || false,
        session: statusData.session || false,
        error: 'QR Code não disponível no momento. Tente novamente.',
        needsQrCode: false
      });
      
    } catch (error) {
      console.error(`❌ Erro ao gerar QR Code do canal ${req.params.id}:`, error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
}