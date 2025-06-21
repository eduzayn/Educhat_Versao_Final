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
    
    // Se NÃO conectado ou sem sessão, tentar restaurar e obter QR Code
    if (statusData.connected === false || statusData.session === false) {
      console.log('🔄 Z-API desconectado, tentando restaurar sessão...');
      
      // Tentar restaurar sessão primeiro
      const restoreUrl = buildZApiUrl(instanceId, token, 'restore-session');
      try {
        const restoreResponse = await fetch(restoreUrl, {
          method: 'GET',
          headers: getZApiHeaders(clientToken)
        });
        
        if (restoreResponse.ok) {
          console.log('✅ Sessão restaurada com sucesso');
          // Aguardar um momento para a sessão se estabelecer
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (restoreError) {
        console.log('⚠️ Falha ao restaurar sessão, prosseguindo com QR Code');
      }
      
      // Obter QR Code
      const qrUrl = buildZApiUrl(instanceId, token, 'qr-code');
      const qrResponse = await fetch(qrUrl, {
        method: 'GET',
        headers: getZApiHeaders(clientToken)
      });

      if (!qrResponse.ok) {
        throw new Error(`Erro ao obter QR Code: ${qrResponse.status} - ${qrResponse.statusText}`);
      }

      const qrData = await qrResponse.json();
      
      console.log('DEBUG - QR Code response:', qrData);
      
      // Z-API pode retornar o QR Code em diferentes campos
      const qrCode = qrData.value || qrData.qrcode || qrData.qr_code || qrData.data;
      
      if (qrCode) {
        return res.json({ 
          connected: statusData.connected || false,
          session: statusData.session || false,
          qrCode: qrCode,
          needsQrCode: true,
          message: 'QR Code disponível. Escaneie rapidamente com seu WhatsApp para conectar.',
          instructions: 'Abra o WhatsApp > Menu (3 pontos) > Dispositivos conectados > Conectar dispositivo'
        });
      } else {
        // Tentar reiniciar instância para gerar novo QR Code
        console.warn('QR Code não disponível, tentando reiniciar instância:', qrData);
        
        try {
          const restartUrl = buildZApiUrl(instanceId, token, 'restart');
          const restartResponse = await fetch(restartUrl, {
            method: 'POST',
            headers: getZApiHeaders(clientToken)
          });
          
          if (restartResponse.ok) {
            console.log('Instância reiniciada, aguardando QR Code...');
            
            // Aguardar 3 segundos e tentar novamente
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const newQrResponse = await fetch(qrUrl, {
              method: 'GET',
              headers: getZApiHeaders(clientToken)
            });
            
            if (newQrResponse.ok) {
              const newQrData = await newQrResponse.json();
              const newQrCode = newQrData.value || newQrData.qrcode || newQrData.qr_code || newQrData.data;
              
              if (newQrCode) {
                return res.json({ 
                  connected: true,
                  session: false,
                  qrCode: newQrCode,
                  needsQrCode: true,
                  message: 'QR Code gerado após reinicialização da instância. Escaneie rapidamente.'
                });
              }
            }
          }
        } catch (restartError) {
          console.error('Erro ao reiniciar instância:', restartError);
        }
        
        return res.json({
          connected: true,
          session: false,
          needsQrCode: true,
          error: 'QR Code temporariamente indisponível',
          message: 'Instância conectada mas QR Code não está disponível. Tente novamente em alguns segundos.',
          suggestion: 'Verifique se o WhatsApp não está sendo usado em outro dispositivo.'
        });
      }
    }
    
    // Se não conectado (statusData.connected === false)
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