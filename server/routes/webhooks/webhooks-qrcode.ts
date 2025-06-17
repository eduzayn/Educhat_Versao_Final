import { storage } from "../storage";
import { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from "../../utils/zapi";

/**
 * Obtém QR Code para conexão WhatsApp
 */
export async function handleGetQRCode(req: any, res: any) {
  try {
    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({ error: credentials.error });
    }

    const { instanceId, token, clientToken } = credentials;
    const url = buildZApiUrl(instanceId, token, 'qr-code');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getZApiHeaders(clientToken)
    });

    if (!response.ok) {
      throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.connected === true) {
      return res.json({ 
        connected: true, 
        message: 'WhatsApp já está conectado' 
      });
    }
    
    if (data.value) {
      return res.json({ 
        qrCode: data.value,
        connected: false 
      });
    }
    
    res.status(400).json({ 
      error: 'QR Code não disponível. Verifique as credenciais da Z-API.' 
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter QR Code:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}

/**
 * Obtém QR Code para um canal específico
 */
export async function handleGetChannelQRCode(req: any, res: any) {
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
    
    const url = buildZApiUrl(instanceId, token, 'qr-code');
    const response = await fetch(url, {
      method: 'GET',
      headers: getZApiHeaders(clientToken)
    });

    if (!response.ok) {
      throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.connected === true) {
      return res.json({ 
        connected: true, 
        message: 'WhatsApp já está conectado' 
      });
    }
    
    if (data.value) {
      return res.json({ 
        qrCode: data.value,
        connected: false 
      });
    }
    
    res.status(400).json({ 
      error: 'QR Code não disponível. Verifique as credenciais da Z-API.' 
    });
    
  } catch (error) {
    console.error(`❌ Erro ao obter QR Code do canal ${req.params.id}:`, error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
} 