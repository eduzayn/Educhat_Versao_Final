import type { Express } from 'express';
import multer from 'multer';
import * as storage from '../../storage';
import { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from '../../utils/zapi';
import { zapiLogger } from '../../utils/zapiLogger';

// Configure multer for audio upload in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    // Aceitar qualquer arquivo que contenha 'audio' no mimetype ou extensão comum de áudio
    const isAudio = file.mimetype.startsWith('audio/') || 
                   file.originalname.match(/\.(mp3|wav|ogg|webm|m4a|aac)$/i) ||
                   file.mimetype.includes('audio') ||
                   file.mimetype === 'application/octet-stream'; // Para casos onde o mimetype não é detectado
    
    if (isAudio) {
      cb(null, true);
    } else {
      console.log('📋 Arquivo rejeitado:', {
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size
      });
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

export function registerZApiRoutes(app: Express) {
  
  // Endpoint para diagnóstico de logs Z-API
  app.get('/api/zapi/diagnostic', async (req, res) => {
    try {
      const logs = zapiLogger.getAllLogs();
      res.json({
        success: true,
        logs: logs.slice(-50), // Últimos 50 logs
        summary: zapiLogger.getSummary()
      });
    } catch (error) {
      console.error('Erro ao buscar logs Z-API:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Send audio via Z-API - REST: POST /api/zapi/send-audio e POST /api/upload/audio (consolidado)
  app.post(['/api/zapi/send-audio', '/api/upload/audio'], upload.single('audio'), async (req, res) => {
    const startTime = Date.now();
    let requestId: string;
    
    try {
      const { phone, conversationId } = req.body;
      const audioFile = req.file;
      
      if (!audioFile) {
        return res.status(400).json({ 
          error: 'Arquivo de áudio é obrigatório' 
        });
      }

      // Se não temos phone, buscar da conversa
      let targetPhone = phone;
      if (!targetPhone && conversationId) {
        const conversation = await storage.getConversation(parseInt(conversationId));
        if (conversation?.contact?.phone) {
          targetPhone = conversation.contact.phone;
        }
      }
      
      if (!targetPhone) {
        return res.status(400).json({ 
          error: 'Telefone do destinatário não encontrado' 
        });
      }

      // Iniciar rastreamento
      requestId = zapiLogger.logSendStart(targetPhone, 'audio', undefined);

      // Buscar credenciais do canal ativo
      const channel = await storage.channel.getActiveWhatsAppChannel();
      let credentials;
      
      if (channel?.zapiConfig) {
        credentials = validateZApiCredentials(
          channel.zapiConfig.instanceId,
          channel.zapiConfig.token,
          channel.zapiConfig.clientToken
        );
        zapiLogger.logCredentialsValidation(credentials.valid, 'channel', credentials.error, requestId);
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
      const cleanPhone = targetPhone.replace(/\D/g, '');

      // Converter áudio para OGG usando FFmpeg (formato aceito pela Z-API)
      const tempDir = '/tmp';
      const inputPath = `${tempDir}/input_${Date.now()}.webm`;
      const outputPath = `${tempDir}/output_${Date.now()}.ogg`;
      
      try {
        const fs = await import('fs');
        const { promisify } = await import('util');
        const { exec } = await import('child_process');
        const execAsync = promisify(exec);
        
        // Salvar arquivo temporário
        await fs.promises.writeFile(inputPath, audioFile.buffer);
        
        // Converter para OGG com FFmpeg
        const ffmpegCommand = `ffmpeg -i "${inputPath}" -c:a libvorbis -ar 16000 -ac 1 -b:a 32k "${outputPath}" -y`;
        await execAsync(ffmpegCommand);
        
        // Ler arquivo convertido
        const convertedBuffer = await fs.promises.readFile(outputPath);
        const audioBase64 = convertedBuffer.toString('base64');
        
        // Limpar arquivos temporários
        await fs.promises.unlink(inputPath).catch(() => {});
        await fs.promises.unlink(outputPath).catch(() => {});
        
        console.log(`🎵 Áudio convertido para OGG: ${audioBase64.length} bytes`);
        
        // Formato correto conforme documentação Z-API oficial
        const url = buildZApiUrl(instanceId, token, 'send-audio');
        const payload = {
          phone: cleanPhone,
          audio: `data:audio/ogg;base64,${audioBase64}`
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

          // Criar mensagem no banco de dados após sucesso na Z-API
          const message = await storage.createMessage({
            conversationId: parseInt(conversationId),
            content: '🎵 Áudio enviado',
            isFromContact: false,
            messageType: 'audio',
            sentAt: new Date(),
            metadata: {
              zaapId: parsedResponse.messageId || parsedResponse.id,
              messageId: parsedResponse.messageId || parsedResponse.id,
              phone: cleanPhone,
              instanceId: instanceId,
              audioSize: audioBase64.length,
              mimeType: 'audio/ogg',
              duration: req.body.duration ? parseInt(req.body.duration) : undefined
            }
          });

          // Salvar arquivo de áudio no banco para streaming
          const { mediaFiles } = await import('@shared/schema');
          const { db } = await import('../../db');
          
          try {
            await db.insert(mediaFiles).values({
              messageId: message.id,
              fileName: `audio_${message.id}.ogg`,
              originalName: audioFile.originalname || `audio_${message.id}.ogg`,
              mimeType: 'audio/ogg',
              fileSize: convertedBuffer.length,
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

          zapiLogger.logSendComplete(response.status, 'success', Date.now() - startTime, requestId);
          
          return res.json({
            success: true,
            messageId: parsedResponse.messageId || parsedResponse.id,
            localMessageId: message.id,
            message: 'Áudio enviado via Z-API com sucesso'
          });

        } catch (fetchError) {
          clearTimeout(timeoutId);
          zapiLogger.logFetchError(fetchError, requestId);
          throw fetchError;
        }

      } catch (conversionError) {
        console.error('Erro na conversão FFmpeg:', conversionError);
        throw new Error(`Falha na conversão de áudio: ${conversionError.message}`);
      }

    } catch (error) {
      zapiLogger.logError('GENERAL_ERROR', error, requestId);
      return res.status(500).json({
        error: error.message,
        requestId,
        duration: Date.now() - startTime
      });
    }
  });

  // Endpoint para servir arquivos de áudio
  app.get('/api/audio/:messageId', async (req, res) => {
    try {
      const { messageId } = req.params;
      
      const { mediaFiles } = await import('@shared/schema');
      const { db } = await import('../../db');
      const { eq } = await import('drizzle-orm');
      
      const mediaFile = await db.select().from(mediaFiles).where(eq(mediaFiles.messageId, parseInt(messageId))).limit(1);
      
      if (!mediaFile || mediaFile.length === 0) {
        return res.status(404).json({ error: 'Arquivo de áudio não encontrado' });
      }
      
      const file = mediaFile[0];
      const audioBuffer = Buffer.from(file.fileData, 'base64');
      
      res.set({
        'Content-Type': file.mimeType || 'audio/webm',
        'Content-Length': audioBuffer.length,
        'Cache-Control': 'public, max-age=31536000'
      });
      
      res.send(audioBuffer);
    } catch (error) {
      console.error('Erro ao servir arquivo de áudio:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}