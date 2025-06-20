// Teste de logs Z-API - Simular envio de mensagem para validar sistema de logs
import fetch from 'node-fetch';

async function testZApiLogs() {
  console.log('🧪 Iniciando teste de logs Z-API...');
  
  try {
    // Teste 1: Tentar enviar mensagem (deve falhar sem credenciais válidas)
    console.log('📤 Teste 1: Enviando mensagem de teste...');
    const response = await fetch('http://localhost:5000/api/zapi/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '5511999999999',
        message: 'Teste de logs Z-API - Sistema de diagnóstico'
      })
    });
    
    const result = await response.json();
    console.log('📥 Resposta:', result);
    
    // Aguardar um pouco para logs serem processados
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 2: Verificar diagnóstico
    console.log('📊 Teste 2: Buscando diagnóstico...');
    const diagnosticResponse = await fetch('http://localhost:5000/api/zapi/diagnostic');
    const diagnostic = await diagnosticResponse.json();
    
    console.log('📈 Diagnóstico:', JSON.stringify(diagnostic, null, 2));
    
    // Teste 3: Se houver requestId, buscar logs específicos
    if (result.requestId) {
      console.log(`🔍 Teste 3: Buscando logs para requestId ${result.requestId}...`);
      const logsResponse = await fetch(`http://localhost:5000/api/zapi/logs/${result.requestId}`);
      const logs = await logsResponse.json();
      
      console.log('📝 Logs específicos:', JSON.stringify(logs, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testZApiLogs();