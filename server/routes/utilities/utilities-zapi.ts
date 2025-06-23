import { Express, Response } from 'express';
import multer from 'multer';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage/index";
import { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from '../../utils/zapi';
import { zapiLogger } from '../../utils/zapiLogger';

// Configure multer for audio upload in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

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
      let finalChannelId = channelId;
      
      // 🔒 CORREÇÃO CRÍTICA: Verificar canal original da conversa para manter consistência
      if (conversationId) {
        try {
          const conversation = await storage.getConversation(conversationId);
          if (conversation && conversation.channelId) {
            // Se a conversa já tem um canal definido, SEMPRE usar esse canal
            finalChannelId = conversation.channelId;
            console.log(`🔒 CANAL-LOCK: Conversa ${conversationId} mantendo canal original ${finalChannelId}`);
          } else if (conversation && !conversation.channelId && channelId) {
            // Se conversa existe mas não tem canal, atualizar com o canal fornecido
            await storage.updateConversation(conversationId, { channelId });
            finalChannelId = channelId;
            console.log(`📌 CANAL-SET: Conversa ${conversationId} definindo canal inicial ${channelId}`);
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao verificar canal da conversa ${conversationId}:`, error);
          // Continua com channelId fornecido ou busca canal ativo
        }
      }
      
      // Se finalChannelId foi definido, buscar credenciais específicas do canal
      if (finalChannelId) {
        try {
          const channel = await storage.getChannel(finalChannelId);
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
        // Buscar canal ativo padrão apenas se não há canal específico
        try {
          const activeChannel = await storage.channel.getActiveWhatsAppChannel();
          if (!activeChannel) {
            zapiLogger.logError('NO_ACTIVE_CHANNEL', 'Nenhum canal WhatsApp ativo encontrado', requestId);
            return res.status(400).json({ 
              error: 'Nenhum canal WhatsApp ativo configurado' 
            });
          }

          finalChannelId = activeChannel.id;
          
          // Se há conversationId, atualizar com o canal ativo padrão
          if (conversationId) {
            try {
              await storage.updateConversation(conversationId, { channelId: finalChannelId });
              console.log(`📌 CANAL-DEFAULT: Conversa ${conversationId} usando canal ativo padrão ${finalChannelId}`);
            } catch (updateError) {
              console.warn(`⚠️ Erro ao atualizar canal da conversa:`, updateError);
            }
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

  // Send audio via Z-API - REST: POST /api/zapi/send-audio
  app.post('/api/zapi/send-audio', upload.single('audio'), async (req, res) => {
    const startTime = Date.now();
    let requestId: string;
    
    try {
      const { phone, conversationId } = req.body;
      const audioFile = req.file;
      
      if (!phone || !audioFile) {
        return res.status(400).json({ 
          error: 'Phone e arquivo de áudio são obrigatórios' 
        });
      }

      // Iniciar rastreamento
      requestId = zapiLogger.logSendStart(phone, 'audio', undefined);

      // Buscar credenciais do canal ativo
      const channel = await storage.channel.getActiveWhatsAppChannel();
      let credentials;
      
      if (channel?.settings?.zapiInstanceId) {
        credentials = {
          valid: true,
          instanceId: channel.settings.zapiInstanceId,
          token: channel.settings.zapiToken,
          clientToken: channel.settings.zapiClientToken
        };
        zapiLogger.logCredentialsValidation(true, 'active_channel', undefined, requestId);
      } else {
        credentials = validateZApiCredentials();
        zapiLogger.logCredentialsValidation(credentials.valid, 'env_fallback', credentials.error, requestId);
      }

      if (!credentials.valid) {
        zapiLogger.logError('INVALID_CREDENTIALS', credentials.error, requestId);
        return res.status(400).json({ 
          error: `Configuração Z-API inválida: ${credentials.error}` 
        });
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = phone.replace(/\D/g, '');

      // Converter áudio para base64
      let audioBase64;
      if (audioFile.buffer) {
        audioBase64 = audioFile.buffer.toString('base64');
      } else {
        const fs = await import('fs');
        const audioBuffer = await fs.promises.readFile(audioFile.path);
        audioBase64 = audioBuffer.toString('base64');
      }

      const dataUrl = `data:${audioFile.mimetype || 'audio/webm'};base64,${audioBase64}`;
      
      const url = buildZApiUrl(instanceId, token, 'send-audio');
      const payload = {
        phone: cleanPhone,
        audio: dataUrl
      };

      const headers = {
        'Client-Token': clientToken,
        'Content-Type': 'application/json'
      };
      
      zapiLogger.logApiRequest(url, { phone: cleanPhone, audioSize: audioBase64.length }, headers, requestId);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        zapiLogger.logTimeout(15000, requestId);
      }, 15000); // 15s timeout para áudios

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
          throw new Error(`Resposta inválida da Z-API: ${responseText}`);
        }

        zapiLogger.logApiResponse(response.status, response.statusText, parsedResponse, requestDuration, requestId);

        if (!response.ok) {
          throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText} - ${JSON.stringify(parsedResponse)}`);
        }

        // Criar mensagem no banco de dados
        if (conversationId) {
          const message = await storage.message.createMessage({
            conversationId: parseInt(conversationId),
            content: '🎵 Áudio enviado',
            isFromContact: false,
            messageType: 'audio',
            sentAt: new Date(),
            isDeleted: false,
            metadata: {
              zaapId: parsedResponse.messageId || parsedResponse.id,
              messageId: parsedResponse.messageId || parsedResponse.id,
              phone: cleanPhone,
              instanceId: instanceId,
              audioSize: audioBase64.length,
              mimeType: audioFile.mimetype || 'audio/webm',
              duration: req.body.duration ? parseInt(req.body.duration) : undefined
            }
          });

          // Salvar arquivo de áudio no banco para streaming
          const { mediaFiles } = await import('@shared/schema');
          const { db } = await import('../../db');
          
          try {
            await db.insert(mediaFiles).values({
              messageId: message.id,
              fileName: `audio_${message.id}.${audioFile.mimetype?.split('/')[1] || 'webm'}`,
              originalName: audioFile.originalname || `audio_${message.id}.webm`,
              mimeType: audioFile.mimetype || 'audio/webm',
              fileSize: audioFile.size || audioBase64.length,
              fileData: audioBase64,
              mediaType: 'audio',
              duration: req.body.duration ? parseInt(req.body.duration) : undefined,
              isCompressed: false,
              zapiSent: true,
              zapiMessageId: parsedResponse.messageId || parsedResponse.id
            });
            
            console.log(`💾 Arquivo de áudio salvo no banco para mensagem ${message.id}`);
          } catch (dbError) {
            console.error('Erro ao salvar arquivo de áudio no banco:', dbError);
          }

          zapiLogger.logDatabaseUpdate(message.id, true, undefined, requestId);

          // Broadcast via WebSocket
          try {
            const { broadcast, broadcastToAll } = await import('../realtime');
            broadcast(parseInt(conversationId), {
              type: 'new_message',
              conversationId: parseInt(conversationId),
              message: message
            });
            broadcastToAll({
              type: 'new_message',
              conversationId: parseInt(conversationId),
              message: message
            });
          } catch (wsError) {
            console.error('Erro no WebSocket broadcast:', wsError);
          }
        }
        
        res.json(parsedResponse);
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          const timeoutError = new Error('Timeout: Envio de áudio cancelado após 15 segundos');
          zapiLogger.logError('FETCH_TIMEOUT', timeoutError, requestId);
          throw timeoutError;
        }
        
        zapiLogger.logError('FETCH_ERROR', fetchError, requestId);
        throw fetchError;
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      zapiLogger.logError('SEND_AUDIO_ERROR', error, requestId!);
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        requestId: requestId!,
        duration
      });
    }
  });
}