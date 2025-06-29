// Monitor robusto de conectividade Z-API com alertas
const { validateZApiCredentials } = require('../core/zapi-utils');

let lastConnectionCheck = null;
let consecutiveFailures = 0;
let isMonitoring = false;

async function checkZApiConnection() {
  try {
    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      console.error('❌ ALERTA: Credenciais Z-API inválidas');
      return false;
    }

    const { instanceId, token, clientToken } = credentials;
    const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/status`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Client-Token': clientToken || '',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const data = await response.json();
    const isConnected = data.connected && data.smartphoneConnected;
    
    if (isConnected) {
      if (consecutiveFailures > 0) {
        console.log(`🟢 Z-API RECONECTADA após ${consecutiveFailures} falhas`);
      }
      consecutiveFailures = 0;
      lastConnectionCheck = new Date();
      return true;
    } else {
      consecutiveFailures++;
      console.error(`🔴 Z-API DESCONECTADA - Falha ${consecutiveFailures}`);
      console.error(`   Connected: ${data.connected}`);
      console.error(`   Smartphone: ${data.smartphoneConnected}`);
      return false;
    }
    
  } catch (error) {
    consecutiveFailures++;
    console.error(`❌ ERRO Z-API (${consecutiveFailures}):`, error.message);
    return false;
  }
}

function startZApiMonitoring() {
  if (isMonitoring) return;
  
  isMonitoring = true;
  console.log('🔍 Iniciando monitoramento contínuo da Z-API...');
  
  // Verificar a cada 30 segundos
  setInterval(async () => {
    await checkZApiConnection();
    
    // Alerta crítico após 3 falhas consecutivas
    if (consecutiveFailures >= 3) {
      console.error('🚨🚨🚨 ALERTA CRÍTICO: Z-API DESCONECTADA POR MAIS DE 90 SEGUNDOS 🚨🚨🚨');
      console.error('   MENSAGENS DE ALUNOS PODEM ESTAR SENDO PERDIDAS');
      console.error('   VERIFICAR IMEDIATAMENTE O PAINEL DA Z-API');
    }
  }, 30000);
}

module.exports = {
  checkZApiConnection,
  startZApiMonitoring,
  getLastCheck: () => lastConnectionCheck,
  getFailureCount: () => consecutiveFailures
};