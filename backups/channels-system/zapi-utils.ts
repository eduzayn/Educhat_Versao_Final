export function validateZApiCredentials() {
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