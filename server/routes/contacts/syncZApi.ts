export async function syncContactWithZApi(contact: any) {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;
  if (!instanceId || !token || !clientToken) {
    throw new Error('Credenciais Z-API não configuradas');
  }
  const phoneNumber = contact.phone.replace(/\D/g, '');
  if (!phoneNumber.startsWith('55')) {
    throw new Error('Número deve estar em formato brasileiro (+55)');
  }
  try {
    const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/contacts`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
      body: JSON.stringify({
        phone: phoneNumber,
        name: contact.name
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro Z-API: ${response.status} - ${errorData}`);
    }
    console.log(`✅ Contato ${contact.name} (${phoneNumber}) adicionado ao Z-API`);
    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao sincronizar contato com Z-API:', error);
    throw error;
  }
} 