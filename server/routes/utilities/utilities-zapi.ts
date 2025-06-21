import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage/index";
import { validateZApiCredentials } from '../../utils/zapi';
import { zapiLogger } from '../../utils/zapiLogger';

export function registerZApiRoutes(app: Express) {
  
  // Endpoint para diagnóstico de logs Z-API
  app.get('/api/zapi/diagnostic', async (req, res) => {
    try {
      const report = zapiLogger.generateDiagnosticReport();
      res.json({
        success: true,
        report,
        recentLogs: zapiLogger.getRecentLogs(20)
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao gerar relatório de diagnóstico',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint para buscar logs por requestId
  app.get('/api/zapi/logs/:requestId', async (req, res) => {
    try {
      const { requestId } = req.params;
      const logs = zapiLogger.getLogsByRequestId(requestId);
      res.json({
        success: true,
        requestId,
        logs
      });
    } catch (error) {
      res.status(500).json({
        error: 'Erro ao buscar logs',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  // Cache para o status Z-API (10 segundos)
  let statusCache: { data: any; timestamp: number } | null = null;
  const CACHE_DURATION = 10000; // 10 segundos para reduzir ainda mais a carga

  // Z-API Status endpoint - REST: GET /api/zapi/status
  app.get('/api/zapi/status', async (req, res) => {
    try {
      // Verificar cache primeiro
      const now = Date.now();
      if (statusCache && (now - statusCache.timestamp) < CACHE_DURATION) {
        return res.json(statusCache.data);
      }

      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/status`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Atualizar cache
      statusCache = { data, timestamp: now };
      
      // Só logar se houver mudança de status ou erro real
      if (data.error && data.error !== 'You are already connected.') {
        console.log('⚠️ Z-API Status:', data);
      }
      
      res.json(data);
      
    } catch (error) {
      console.error('Erro ao obter status Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Send message via Z-API - REST: POST /api/zapi/send-message
  app.post('/api/zapi/send-message', async (req, res) => {
    const startTime = Date.now();
    let requestId: string;
    
    try {
      const { phone, message, conversationId, channelId } = req.body;
      
      // Iniciar rastreamento detalhado
      requestId = zapiLogger.logSendStart(phone, message, channelId);
      
      if (!phone || !message) {
        zapiLogger.logError('VALIDATION_ERROR', 'Phone e message são obrigatórios', requestId);
        return res.status(400).json({ 
          error: 'Phone e message são obrigatórios' 
        });
      }

      let credentials;
      
      // Se channelId foi fornecido, buscar credenciais específicas do canal
      if (channelId) {
        try {
          const channel = await storage.getChannel(channelId);
          if (!channel || !channel.isActive || channel.type !== 'whatsapp') {
            zapiLogger.logError('CHANNEL_NOT_FOUND', 'Canal WhatsApp não encontrado ou inativo', requestId);
            return res.status(400).json({ 
              error: 'Canal WhatsApp não encontrado ou inativo' 
            });
          }
          
          zapiLogger.logChannelConfig(channel, requestId);
          
          const config = (channel.configuration as any) || {};
          credentials = {
            valid: true,
            instanceId: config.instanceId || channel.instanceId,
            token: config.token || channel.token,
            clientToken: config.clientToken || channel.clientToken
          };
          
          if (!credentials.instanceId || !credentials.token || !credentials.clientToken) {
            zapiLogger.logCredentialsValidation(false, 'channel', 'Credenciais incompletas no canal', requestId);
            return res.status(400).json({ 
              error: 'Canal WhatsApp não configurado corretamente' 
            });
          }
          
          zapiLogger.logCredentialsValidation(true, 'channel', undefined, requestId);
        } catch (error) {
          zapiLogger.logError('CHANNEL_FETCH_ERROR', error, requestId);
          return res.status(500).json({ 
            error: 'Erro ao buscar configurações do canal' 
          });
        }
      } else {
        // CORREÇÃO: Buscar canal ativo padrão em vez de usar credenciais ENV obsoletas
        try {
          const activeChannel = await storage.channel.getActiveWhatsAppChannel();
          if (!activeChannel) {
            zapiLogger.logError('NO_ACTIVE_CHANNEL', 'Nenhum canal WhatsApp ativo encontrado', requestId);
            return res.status(400).json({ 
              error: 'Nenhum canal WhatsApp ativo configurado' 
            });
          }

          credentials = {
            valid: true,
            instanceId: activeChannel.instanceId,
            token: activeChannel.token,
            clientToken: activeChannel.clientToken
          };

          if (!credentials.instanceId || !credentials.token || !credentials.clientToken) {
            zapiLogger.logCredentialsValidation(false, 'active_channel', 'Credenciais incompletas no canal ativo', requestId);
            return res.status(400).json({ 
              error: 'Canal WhatsApp ativo não possui credenciais completas' 
            });
          }

          zapiLogger.logCredentialsValidation(true, 'active_channel', undefined, requestId);
        } catch (error) {
          // Fallback para credenciais padrão apenas se busca do canal falhar
          credentials = validateZApiCredentials();
          if (!credentials.valid) {
            zapiLogger.logCredentialsValidation(false, 'env_fallback', credentials.error, requestId);
            return res.status(400).json({ error: credentials.error });
          }
          zapiLogger.logCredentialsValidation(true, 'env_fallback', undefined, requestId);
        }
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = phone.replace(/\D/g, '');
      
      const payload = {
        phone: cleanPhone,
        message: message.toString()
      };

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
      const headers = {
        'Client-Token': clientToken || '',
        'Content-Type': 'application/json'
      };
      
      zapiLogger.logApiRequest(url, payload, headers, requestId);

      // Configurar timeout otimizado de 8 segundos para máxima velocidade de resposta
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        zapiLogger.logTimeout(8000, requestId);
      }, 8000);
      let data;

      try {
        const requestStartTime = Date.now();
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        const requestDuration = Date.now() - requestStartTime;
        clearTimeout(timeoutId);

        const responseText = await response.text();
        let parsedResponse;
        
        try {
          parsedResponse = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          zapiLogger.logError('JSON_PARSE_ERROR', parseError, requestId);
          zapiLogger.logApiResponse(response.status, response.statusText, responseText, requestDuration, requestId);
          throw new Error(`Resposta inválida da Z-API: ${responseText}`);
        }

        zapiLogger.logApiResponse(response.status, response.statusText, parsedResponse, requestDuration, requestId);

        if (!response.ok) {
          throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText} - ${JSON.stringify(parsedResponse)}`);
        }

        data = parsedResponse;
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          const timeoutError = new Error('Timeout: Requisição cancelada após 8 segundos - verifique conectividade Z-API');
          zapiLogger.logError('FETCH_TIMEOUT', timeoutError, requestId);
          throw timeoutError;
        }
        
        zapiLogger.logError('FETCH_ERROR', fetchError, requestId);
        throw fetchError;
      }

      // Se conversationId foi fornecido, atualizar metadados em background (não bloqueia resposta)
      if (conversationId && data) {
        setImmediate(async () => {
          try {
            const messages = await storage.messages.getMessages(parseInt(conversationId));
            const recentMessage = messages
              .filter(msg => !msg.isFromContact && !(msg.metadata as any)?.zaapId)
              .sort((a, b) => new Date(b.sentAt || new Date()).getTime() - new Date(a.sentAt || new Date()).getTime())[0];
            
            if (recentMessage) {
              await storage.messages.updateMessage(recentMessage.id, {
                metadata: {
                  ...(recentMessage.metadata as any || {}),
                  zaapId: data.messageId || data.id,
                  messageId: data.messageId || data.id,
                  phone: cleanPhone,
                  instanceId: instanceId
                }
              });
              zapiLogger.logDatabaseUpdate(recentMessage.id, true, undefined, requestId);
            }
          } catch (dbError) {
            zapiLogger.logDatabaseUpdate(0, false, dbError instanceof Error ? dbError.message : String(dbError), requestId);
          }
        });
      }
      
      // Resposta imediata para o frontend (otimização de velocidade)
      res.json(data);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      zapiLogger.logError('SEND_MESSAGE_ERROR', error, requestId!);
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        requestId: requestId!,
        duration
      });
    }
  });
}