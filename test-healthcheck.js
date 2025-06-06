// Script para testar o endpoint de healthcheck localmente
const http = require('http');

// Configurações da solicitação
const options = {
  hostname: 'localhost',
  port: 5000, // Ajuste para a porta que sua aplicação está usando localmente
  path: '/api/health',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Testando o endpoint de healthcheck em http://localhost:5000/api/health');

// Realiza a solicitação HTTP
const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  // Concatena os dados recebidos
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // Processa os dados quando a resposta estiver completa
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(data);
      console.log('Resposta recebida:');
      console.log(JSON.stringify(parsedData, null, 2));
      
      // Verificar se a resposta contém o campo status
      if (parsedData.status === 'ok') {
        console.log('\n✅ O endpoint de healthcheck está funcionando corretamente!');
      } else {
        console.log('\n⚠️ O endpoint de healthcheck não retornou status "ok".');
      }
    } catch (e) {
      console.error('Erro ao analisar a resposta JSON:', e);
      console.log('Dados brutos recebidos:', data);
    }
  });
});

// Trata erros de conexão
req.on('error', (e) => {
  console.error(`\n❌ Erro ao conectar ao endpoint de healthcheck: ${e.message}`);
  console.log('\nVerifique se:');
  console.log('1. A aplicação está em execução');
  console.log('2. A porta está correta (atualmente testando na porta 5000)');
  console.log('3. O endpoint /api/health está implementado corretamente');
});

// Finaliza a solicitação
req.end(); 