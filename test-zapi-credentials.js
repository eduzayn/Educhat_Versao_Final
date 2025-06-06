// Arquivo para teste de credenciais Z-API
// Este arquivo ajuda a verificar se as credenciais Z-API estão corretamente configuradas
// Execute com: node test-zapi-credentials.js

console.log('🔍 Verificando credenciais Z-API');

// Verificar variáveis de ambiente
const instanceId = process.env.ZAPI_INSTANCE_ID;
const token = process.env.ZAPI_TOKEN;
const clientToken = process.env.ZAPI_CLIENT_TOKEN;
const baseUrl = process.env.ZAPI_BASE_URL || 'https://api.z-api.io';

console.log('Ambiente:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
console.log(`RENDER_EXTERNAL_URL: ${process.env.RENDER_EXTERNAL_URL || 'não definido'}`);

console.log('\nCredenciais Z-API:');
console.log(`ZAPI_INSTANCE_ID: ${instanceId ? `${instanceId.substring(0, 4)}...${instanceId.substring(instanceId.length - 4)}` : 'não definido'}`);
console.log(`ZAPI_TOKEN: ${token ? `${token.substring(0, 4)}...${token.substring(token.length - 4)}` : 'não definido'}`);
console.log(`ZAPI_CLIENT_TOKEN: ${clientToken ? `${clientToken.substring(0, 4)}...${clientToken.substring(clientToken.length - 4)}` : 'não definido'}`);
console.log(`ZAPI_BASE_URL: ${baseUrl}`);

// Validar formato das credenciais
console.log('\nValidação de formato:');
console.log(`ZAPI_INSTANCE_ID válido: ${instanceId && instanceId.length > 10 ? '✅' : '❌'}`);
console.log(`ZAPI_TOKEN válido: ${token && token.length > 10 ? '✅' : '❌'}`);
console.log(`ZAPI_CLIENT_TOKEN válido: ${clientToken && clientToken.length > 10 ? '✅' : '❌'}`);

// Verificar se há espaços extras
console.log('\nVerificação de espaços extras:');
console.log(`ZAPI_INSTANCE_ID tem espaços extras: ${instanceId && (instanceId.trim() !== instanceId) ? '❌' : '✅'}`);
console.log(`ZAPI_TOKEN tem espaços extras: ${token && (token.trim() !== token) ? '❌' : '✅'}`);
console.log(`ZAPI_CLIENT_TOKEN tem espaços extras: ${clientToken && (clientToken.trim() !== clientToken) ? '❌' : '✅'}`);

// Tentar fazer uma chamada para a API
async function testarAPI() {
  if (!instanceId || !token || !clientToken) {
    console.log('\n❌ Não é possível testar a API: credenciais incompletas');
    return;
  }

  console.log('\nTentando conexão com a API Z-API...');
  
  try {
    const url = `${baseUrl}/instances/${instanceId}/token/${token}/status`;
    console.log(`URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Client-Token': clientToken,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status da resposta: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('Resposta da API:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Erro na resposta:');
      console.log(text);
    }
  } catch (error) {
    console.error('Erro ao chamar a API:', error.message);
  }
}

// Executar o teste da API
testarAPI().then(() => {
  console.log('\nTeste de credenciais concluído');
}); 