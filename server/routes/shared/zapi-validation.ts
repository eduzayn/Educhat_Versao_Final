// Função helper para validar credenciais Z-API
export function validateZApiCredentials() {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !token || !clientToken) {
    return {
      valid: false,
      error: 'Credenciais Z-API não configuradas corretamente'
    };
  }

  return {
    valid: true,
    instanceId,
    token,
    clientToken
  };
}