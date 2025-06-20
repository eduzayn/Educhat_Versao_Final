/**
 * Utilitários Z-API - Consolidado de server/core/zapi-utils.ts
 */

export function validateZApiCredentials(): 
  | { valid: false; error: string }
  | { valid: true; instanceId: string; token: string; clientToken: string } {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !token || !clientToken) {
    return {
      valid: false,
      error: 'Credenciais Z-API não configuradas'
    };
  }

  return {
    valid: true,
    instanceId,
    token,
    clientToken
  };
}

export function buildZApiUrl(instanceId: string, token: string, endpoint: string): string {
  return `https://api.z-api.io/instances/${instanceId}/token/${token}/${endpoint}`;
}

export function getZApiHeaders(clientToken: string) {
  return {
    'Client-Token': clientToken,
    'Content-Type': 'application/json'
  };
}

export async function getContactPhoto(phone: string): Promise<string | null> {
  const credentials = validateZApiCredentials();
  if (!credentials.valid) {
    console.log('❌ Credenciais Z-API não válidas para buscar foto do contato');
    return null;
  }

  try {
    const url = buildZApiUrl(credentials.instanceId, credentials.token, `chats/${phone}/profile-image`);
    const headers = getZApiHeaders(credentials.clientToken);

    const response = await fetch(url, { headers, method: 'GET' });
    
    if (!response.ok) {
      console.log(`❌ Erro ao buscar foto do contato ${phone}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.profilePictureUrl) {
      console.log(`✅ Foto do contato ${phone} obtida via Z-API`);
      return data.profilePictureUrl;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Erro ao buscar foto do contato ${phone}:`, error);
    return null;
  }
}