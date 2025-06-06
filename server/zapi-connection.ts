import * as QRCode from 'qrcode';

export interface ZApiCredentials {
  instanceId: string;
  token: string;
  clientToken: string;
}

export interface ZApiValidationSuccess {
  valid: true;
  instanceId: string;
  token: string;
  clientToken: string;
}

export interface ZApiValidationError {
  valid: false;
  error: string;
}

export type ZApiValidationResult = ZApiValidationSuccess | ZApiValidationError;

export function validateZApiCredentials(): ZApiValidationResult {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;
  
  if (!instanceId || !token || !clientToken) {
    return { valid: false, error: 'Credenciais da Z-API não configuradas' };
  }
  
  return { valid: true, instanceId, token, clientToken };
}

export async function generateQRCode(qrValue: string): Promise<string> {
  try {
    return await QRCode.toDataURL(qrValue, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    throw new Error(`Erro ao gerar QR Code: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function getZApiStatus(credentials: ZApiCredentials) {
  const { instanceId, token, clientToken } = credentials;
  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/status`;
  
  const response = await fetch(url, {
    headers: {
      'Client-Token': clientToken,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Z-API Status Error: ${response.status} - ${response.statusText}`);
  }

  return await response.json();
}

export async function getZApiQRCode(credentials: ZApiCredentials) {
  const { instanceId, token, clientToken } = credentials;
  
  // Primeiro, tentar reiniciar a instância para forçar novo QR Code
  try {
    console.log('🔄 Reiniciando instância Z-API para gerar novo QR Code...');
    const restartUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/restart`;
    await fetch(restartUrl, {
      method: 'POST',
      headers: {
        'Client-Token': clientToken,
        'Content-Type': 'application/json'
      }
    });
    
    // Aguardar um pouco para a instância reiniciar
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (error) {
    console.log('Tentativa de restart da instância:', error);
  }
  
  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/qr-code`;
  console.log('📱 Solicitando QR Code da Z-API:', url);
  
  const response = await fetch(url, {
    headers: {
      'Client-Token': clientToken,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Erro da Z-API:', errorText);
    throw new Error(`Z-API QR Code Error: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  console.log('📄 Resposta da Z-API QR Code:', data);
  
  return data;
}