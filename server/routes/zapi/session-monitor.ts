/**
 * Monitor de Sessão Z-API - Detecta quando sessão WhatsApp está inativa
 */

import { Request, Response, Router } from 'express';
import { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from '../../utils/zapi';

const router = Router();

interface SessionStatus {
  connected: boolean;
  session: boolean;
  smartphoneConnected?: boolean;
  qrCode?: string;
  lastCheck: string;
  instanceStatus: 'active' | 'inactive' | 'error';
}

// Cache do status da sessão
let cachedSessionStatus: SessionStatus | null = null;
let lastCheckTime = 0;
const CACHE_DURATION = 30000; // 30 segundos

/**
 * Verifica status da sessão Z-API
 */
async function checkSessionStatus(): Promise<SessionStatus> {
  const now = Date.now();
  
  // Retorna cache se ainda válido
  if (cachedSessionStatus && (now - lastCheckTime) < CACHE_DURATION) {
    return cachedSessionStatus;
  }

  const credentials = validateZApiCredentials();
  if (!credentials.valid) {
    const errorStatus: SessionStatus = {
      connected: false,
      session: false,
      lastCheck: new Date().toISOString(),
      instanceStatus: 'error'
    };
    cachedSessionStatus = errorStatus;
    lastCheckTime = now;
    return errorStatus;
  }

  try {
    const { instanceId, token, clientToken } = credentials;
    const url = buildZApiUrl(instanceId, token, 'status');
    const headers = getZApiHeaders(clientToken);

    const response = await fetch(url, { 
      method: 'GET', 
      headers,
      timeout: 10000 
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = await response.json();
    
    const sessionStatus: SessionStatus = {
      connected: data.connected || false,
      session: data.session || false,
      smartphoneConnected: data.smartphoneConnected,
      lastCheck: new Date().toISOString(),
      instanceStatus: data.connected ? 'active' : 'inactive'
    };

    // Se sessão inativa, buscar QR Code
    if (sessionStatus.connected && !sessionStatus.session) {
      try {
        const qrUrl = buildZApiUrl(instanceId, token, 'qr-code');
        const qrResponse = await fetch(qrUrl, { 
          method: 'GET', 
          headers,
          timeout: 5000 
        });
        
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          sessionStatus.qrCode = qrData.value || qrData.qrCode;
        }
      } catch (qrError) {
        console.log('Não foi possível obter QR Code:', qrError);
      }
    }

    cachedSessionStatus = sessionStatus;
    lastCheckTime = now;
    return sessionStatus;

  } catch (error) {
    console.error('Erro ao verificar status da sessão Z-API:', error);
    
    const errorStatus: SessionStatus = {
      connected: false,
      session: false,
      lastCheck: new Date().toISOString(),
      instanceStatus: 'error'
    };
    
    cachedSessionStatus = errorStatus;
    lastCheckTime = now;
    return errorStatus;
  }
}

/**
 * GET /api/zapi/session-status
 * Retorna status detalhado da sessão
 */
router.get('/session-status', async (req: Request, res: Response) => {
  try {
    const status = await checkSessionStatus();
    
    res.json({
      success: true,
      status,
      recommendations: getRecommendations(status),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar status da sessão',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/zapi/restart-session
 * Reinicia a instância Z-API
 */
router.post('/restart-session', async (req: Request, res: Response) => {
  try {
    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({
        success: false,
        error: credentials.error
      });
    }

    const { instanceId, token, clientToken } = credentials;
    const url = buildZApiUrl(instanceId, token, 'restart');
    const headers = getZApiHeaders(clientToken);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      timeout: 15000
    });

    const data = await response.json();

    // Limpar cache para forçar nova verificação
    cachedSessionStatus = null;
    lastCheckTime = 0;

    res.json({
      success: response.ok,
      message: response.ok ? 'Instância reiniciada com sucesso' : 'Falha ao reiniciar instância',
      data,
      nextSteps: [
        'Aguarde 30-60 segundos para a instância reiniciar',
        'Verifique o status novamente',
        'Se necessário, escaneie o QR Code para reconectar'
      ]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao reiniciar instância',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/zapi/qr-code
 * Obtém QR Code para reconexão
 */
router.get('/qr-code', async (req: Request, res: Response) => {
  try {
    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({
        success: false,
        error: credentials.error
      });
    }

    const { instanceId, token, clientToken } = credentials;
    const url = buildZApiUrl(instanceId, token, 'qr-code');
    const headers = getZApiHeaders(clientToken);

    const response = await fetch(url, {
      method: 'GET',
      headers,
      timeout: 10000
    });

    const data = await response.json();

    res.json({
      success: response.ok,
      qrCode: data.value || data.qrCode,
      instructions: [
        '1. Abra o WhatsApp no seu celular',
        '2. Vá em Configurações > Aparelhos conectados',
        '3. Toque em "Conectar um aparelho"',
        '4. Escaneie o QR Code abaixo',
        '5. Aguarde a confirmação da conexão'
      ],
      data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao obter QR Code',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Gera recomendações baseadas no status
 */
function getRecommendations(status: SessionStatus): string[] {
  const recommendations: string[] = [];

  if (!status.connected) {
    recommendations.push('Instância Z-API desconectada - verificar configurações');
    recommendations.push('Contatar suporte Z-API se problema persistir');
  } else if (!status.session) {
    recommendations.push('WhatsApp não está conectado - escaneie o QR Code');
    recommendations.push('Use /api/zapi/qr-code para obter código de conexão');
    recommendations.push('Certifique-se de que o WhatsApp está instalado e funcionando');
  } else {
    recommendations.push('Sessão ativa - sistema funcionando normalmente');
    recommendations.push('Continue monitorando através do diagnóstico Z-API');
  }

  return recommendations;
}

/**
 * Monitor automático que verifica status periodicamente
 */
export function startSessionMonitor() {
  const checkInterval = 60000; // 1 minuto
  
  setInterval(async () => {
    try {
      const status = await checkSessionStatus();
      
      // Log apenas se status mudou ou há problemas
      if (!status.session || !status.connected) {
        console.log(`[SESSION-MONITOR] Status: connected=${status.connected}, session=${status.session}`);
        
        if (!status.session && status.connected) {
          console.log(`[SESSION-MONITOR] ⚠️  WhatsApp desconectado - QR Code necessário`);
        }
      }
      
    } catch (error) {
      console.error('[SESSION-MONITOR] Erro na verificação automática:', error);
    }
  }, checkInterval);
  
  console.log(`[SESSION-MONITOR] Monitor de sessão iniciado (intervalo: ${checkInterval/1000}s)`);
}

export default router;