import { storage } from "../../storage/index";
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

    const instanceId = channel.instanceId || channel.instance_id;
    const token = channel.token;
    const clientToken = channel.clientToken || channel.client_token;
    
    console.log('DEBUG - Credenciais do canal:', { 
      channelId, 
      instanceId: instanceId?.substring(0, 8) + '...', 
      token: token?.substring(0, 8) + '...', 
      clientToken: clientToken?.substring(0, 8) + '...' 
    });
    
    if (!instanceId || !token || !clientToken) {
      console.log('Credenciais incompletas:', { instanceId: !!instanceId, token: !!token, clientToken: !!clientToken });
      return res.status(400).json({ 
        error: 'Canal não possui credenciais Z-API configuradas' 
      });
    }
    
    // Primeiro verificar status da sessão
    const statusUrl = buildZApiUrl(instanceId, token, 'status');
    const statusResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: getZApiHeaders(clientToken)
    });

    if (!statusResponse.ok) {
      throw new Error(`Erro ao verificar status: ${statusResponse.status} - ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();
    
    console.log('DEBUG - Status Z-API:', statusData);
    
    // Se conectado E com sessão ativa, não precisa de QR Code
    if (statusData.connected === true && statusData.session === true) {
      return res.json({ 
        connected: true,
        session: true,
        message: 'WhatsApp já está conectado e com sessão ativa',
        needsQrCode: false
      });
    }
    
    // Se NÃO conectado, forçar restauração completa da instância
    if (statusData.connected === false) {
      console.log('🔄 Z-API completamente desconectado, forçando restauração...');
      
      // Primeiro: restaurar sessão
      const restoreUrl = buildZApiUrl(instanceId, token, 'restore-session');
      try {
        await fetch(restoreUrl, {
          method: 'GET',
          headers: getZApiHeaders(clientToken)
        });
        console.log('📡 Comando de restauração enviado');
      } catch (error) {
        console.log('⚠️ Falha no restore, continuando...');
      }
      
      // Aguardar e verificar status novamente
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newStatusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: getZApiHeaders(clientToken)
      });
      
      if (newStatusResponse.ok) {
        const newStatus = await newStatusResponse.json();
        console.log('📊 Novo status após restauração:', newStatus);
        
        // Se agora está conectado com sessão, retornar sucesso
        if (newStatus.connected === true && newStatus.session === true) {
          return res.json({
            connected: true,
            session: true,
            message: 'WhatsApp conectado com sucesso após restauração',
            needsQrCode: false
          });
        }
      }
    }
      
    // Obter QR Code usando endpoint correto da Z-API
    const qrUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/qr-code`;
    console.log('🔍 Solicitando QR Code da Z-API:', qrUrl);
    
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
    
    console.log('DEBUG - QR Code response completa:', JSON.stringify(qrData, null, 2));
    
    // Z-API pode retornar o QR Code em diferentes formatos conforme documentação
    const qrCode = qrData.value || qrData.qrcode || qrData.qr_code || qrData.data || qrData.qr;
    
    console.log('🔍 QR Code extraído:', qrCode ? 'Disponível' : 'Não encontrado');
    console.log('🔍 Campos disponíveis:', Object.keys(qrData));
    
    if (qrCode) {
      return res.json({ 
        connected: statusData.connected || false,
        session: statusData.session || false,
        qrCode: qrCode,
        needsQrCode: true,
        message: 'QR Code disponível. Escaneie rapidamente com seu WhatsApp para conectar.',
        instructions: 'Abra o WhatsApp > Menu (3 pontos) > Dispositivos conectados > Conectar dispositivo',
        debug: {
          responseKeys: Object.keys(qrData),
          hasValue: !!qrData.value,
          hasQrcode: !!qrData.qrcode,
          hasQrCode: !!qrData.qr_code,
          hasData: !!qrData.data
        }
      });
    }
    
    // Se não conseguiu obter QR Code, retornar erro
    return res.status(400).json({ 
      connected: statusData.connected || false,
      session: statusData.session || false,
      error: 'Instância Z-API não está conectada',
      message: 'Verifique as credenciais da Z-API.'
    });
    
  } catch (error) {
    console.error(`❌ Erro ao obter QR Code do canal ${req.params.id}:`, error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}