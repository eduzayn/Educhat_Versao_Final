// Script de recuperação emergencial de mensagens perdidas das últimas 24h
const fetch = require('node-fetch');

async function recoverAllMessages() {
  console.log('🚨 INICIANDO RECUPERAÇÃO EMERGENCIAL DE MENSAGENS - ÚLTIMAS 24H');
  
  try {
    // Verificar credenciais Z-API
    const instanceId = process.env.ZAPI_INSTANCE_ID || '3DF871A7ADFB20FB49998E66062CE0C1';
    const token = process.env.ZAPI_TOKEN;
    const clientToken = process.env.ZAPI_CLIENT_TOKEN;
    
    if (!token || !clientToken) {
      throw new Error('❌ Credenciais Z-API não encontradas nas variáveis de ambiente');
    }
    
    console.log(`🔑 Usando instância: ${instanceId}`);
    
    // Buscar mensagens recebidas das últimas 24 horas
    const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/messages/received`;
    
    console.log('📡 Consultando Z-API para mensagens recebidas...');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Client-Token': clientToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`❌ Erro na Z-API: ${response.status} - ${response.statusText}`);
    }
    
    const messages = await response.json();
    console.log(`📱 Total de mensagens encontradas na Z-API: ${messages.length}`);
    
    // Filtrar mensagens das últimas 24 horas
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentMessages = messages.filter(msg => {
      const messageTime = new Date(msg.timestamp || msg.moment || Date.now());
      return messageTime >= last24Hours;
    });
    
    console.log(`⏰ Mensagens das últimas 24h: ${recentMessages.length}`);
    
    let recoveredCount = 0;
    
    // Processar cada mensagem via webhook local
    for (const msg of recentMessages) {
      try {
        // Simular webhook da Z-API
        const webhookData = {
          type: 'ReceivedCallback',
          phone: msg.phone,
          instanceId: instanceId,
          messageId: msg.messageId || msg.id,
          timestamp: msg.timestamp || msg.moment
        };
        
        // Adicionar conteúdo baseado no tipo
        if (msg.text && msg.text.message) {
          webhookData.text = { message: msg.text.message };
        } else if (msg.image) {
          webhookData.image = msg.image;
        } else if (msg.audio) {
          webhookData.audio = msg.audio;
        } else if (msg.video) {
          webhookData.video = msg.video;
        } else if (msg.document) {
          webhookData.document = msg.document;
        }
        
        // Enviar para webhook local
        const webhookResponse = await fetch('http://localhost:5000/api/zapi/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookData)
        });
        
        if (webhookResponse.ok) {
          recoveredCount++;
          console.log(`✅ Mensagem recuperada: ${msg.phone} - ${msg.messageId}`);
        } else {
          console.log(`⚠️ Falha ao processar: ${msg.phone} - ${msg.messageId}`);
        }
        
        // Delay pequeno para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (msgError) {
        console.error(`❌ Erro ao processar mensagem ${msg.messageId}:`, msgError.message);
      }
    }
    
    console.log(`🎉 RECUPERAÇÃO CONCLUÍDA:`);
    console.log(`   📊 Total encontrado na Z-API: ${messages.length}`);
    console.log(`   ⏰ Últimas 24h: ${recentMessages.length}`);
    console.log(`   ✅ Recuperadas com sucesso: ${recoveredCount}`);
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO NA RECUPERAÇÃO:', error.message);
    process.exit(1);
  }
}

recoverAllMessages();