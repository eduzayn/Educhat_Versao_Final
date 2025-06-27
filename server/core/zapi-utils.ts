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
  
  // Se canal for suporte, verificar se existem credenciais específicas
  if (channel === 'suporte' && targetInstanceId === '3E22F2A24288809C2217D63E28193647') {
    const supportInstanceId = process.env.ZAPI_SUPPORT_INSTANCE_ID;
    const supportToken = process.env.ZAPI_SUPPORT_TOKEN;
    const supportClientToken = process.env.ZAPI_SUPPORT_CLIENT_TOKEN;

    // Se todas as credenciais específicas estão configuradas e não são placeholders
    if (supportInstanceId && supportToken && supportClientToken &&
        !supportToken.includes('PLACEHOLDER') && !supportClientToken.includes('PLACEHOLDER')) {
      return {
        valid: true,
        instanceId: supportInstanceId,
        token: supportToken,
        clientToken: supportClientToken
      };
    }
    
    // Fallback temporário: usar credenciais comerciais para canal suporte
    // até que credenciais específicas sejam configuradas
    console.log('⚠️ Canal suporte usando credenciais comerciais (fallback temporário)');
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