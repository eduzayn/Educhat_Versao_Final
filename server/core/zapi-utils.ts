// Função para validar credenciais por canal específico
export function validateZApiCredentialsByChannel(channel?: string) {
  // Mapeamento de canais para instâncias Z-API
  const channelInstanceMap = {
    'comercial': '3DF871A7ADFB20FB49998E66062CE0C1',
    'suporte': '3E22F2A24288809C2217D63E28193647',
    'whatsapp': '3DF871A7ADFB20FB49998E66062CE0C1' // fallback para comercial
  };

  // Determinar a instância baseada no canal
  const targetInstanceId = channel ? channelInstanceMap[channel as keyof typeof channelInstanceMap] : null;
  
  // Se canal for suporte, tentar buscar credenciais específicas
  if (channel === 'suporte' && targetInstanceId === '3E22F2A24288809C2217D63E28193647') {
    // Verificar se existem credenciais específicas para o suporte
    const supportInstanceId = process.env.ZAPI_SUPPORT_INSTANCE_ID || targetInstanceId;
    const supportToken = process.env.ZAPI_SUPPORT_TOKEN || process.env.ZAPI_TOKEN;
    const supportClientToken = process.env.ZAPI_SUPPORT_CLIENT_TOKEN || process.env.ZAPI_CLIENT_TOKEN;

    if (supportInstanceId && supportToken && supportClientToken) {
      return {
        valid: true,
        instanceId: supportInstanceId,
        token: supportToken,
        clientToken: supportClientToken
      };
    }
  }

  // Fallback para credenciais padrão (comercial)
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

// Função original mantida para compatibilidade
export function validateZApiCredentials() {
  return validateZApiCredentialsByChannel();
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