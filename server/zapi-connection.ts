import QRCode from 'qrcode';

export interface ZApiCredentials {
  instanceId: string;
  token: string;
  clientToken: string;
}

export function validateZApiCredentials(): { valid: boolean; error?: string } & Partial<ZApiCredentials> {
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
  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/qr-code`;
  
  const response = await fetch(url, {
    headers: {
      'Client-Token': clientToken,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Z-API QR Code Error: ${response.status} - ${response.statusText}`);
  }

  return await response.json();
}