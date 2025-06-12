// Script de teste para verificar a API de fotos da Z-API
import fetch from 'node-fetch';

async function testZApiPhotoEndpoint() {
  const instanceId = '3DF871A7ADFB20FB49998E66062CE0C1';
  const token = 'A4E42029C248B72DA0842F47';
  const clientToken = 'F8A7C4DC7B1B4B029F6B8E7A9D3C5E6F';
  
  // Pegar um número de telefone dos logs para testar
  const testPhone = '5511957851330'; // Inacio Brumatti dos logs
  
  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/contacts/${testPhone}/profile-picture`;
  
  console.log('🔍 Testando endpoint Z-API:', url);
  console.log('📋 Headers:', {
    'Client-Token': clientToken,
    'Content-Type': 'application/json'
  });
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Client-Token': clientToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('📝 Resposta completa:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('📦 Dados JSON:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('❌ Erro ao fazer parse do JSON:', e.message);
      }
    } else {
      console.log('❌ Erro HTTP:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testZApiPhotoEndpoint();