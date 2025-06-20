/**
 * Z-API Webhook Handler - Consolidado do arquivo principal
 * Responsável por processar webhooks e envio de mensagens via Z-API
 */

import type { Request, Response, Express } from "express";
import { storage } from "../../../storage";
import multer from "multer";
import { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from "../../../utils/zapi";
import { extractMediaUrl, normalizeMessageMetadata } from "../../../utils/mediaUrlExtractor";
import { zapiLogger } from "../../../utils/zapiLogger";

// Configurar multer para upload de áudio em memória
const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mpeg', 'audio/mp4'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de áudio não permitido'));
    }
  }
});

// Configurar multer para upload de imagens em memória
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de imagem não permitido'));
    }
  }
});

// Configurar multer para upload de vídeos - otimizado para velocidade
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB máximo para vídeos
    fieldSize: 100 * 1024 * 1024, // Aumentar limit do campo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/mkv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de vídeo não permitido'));
    }
  }
});

/**
 * Handler para envio de imagens via Z-API
 */
export async function handleSendImage(req: Request, res: Response) {
  const startTime = Date.now();
  let requestId: string;
  
  try {
    const phone = req.body.phone;
    const conversationId = req.body.conversationId;
    const caption = req.body.caption || '';
    
    requestId = zapiLogger.logSendStart(phone, `[IMAGEM] ${caption}`, undefined);
    
    if (!phone || !req.file) {
      zapiLogger.logError('VALIDATION_ERROR', 'Phone e arquivo de imagem são obrigatórios', requestId);
      return res.status(400).json({ 
        error: 'Phone e arquivo de imagem são obrigatórios' 
      });
    }

    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      zapiLogger.logCredentialsValidation(false, 'env', credentials.error, requestId);
      return res.status(400).json({ error: credentials.error });
    }
    
    zapiLogger.logCredentialsValidation(true, 'env', undefined, requestId);

    const { instanceId, token, clientToken } = credentials;
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Converter arquivo para base64 com prefixo data URL conforme documentação Z-API
    const imageBase64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${imageBase64}`;
    
    const payload = {
      phone: cleanPhone,
      image: dataUrl,
      caption: caption
    };

    const url = buildZApiUrl(instanceId, token, 'send-image');
    const headers = {
      'Content-Type': 'application/json',
      'Client-Token': clientToken,
    };
    
    zapiLogger.logApiRequest(url, {
      ...payload,
      image: `[BASE64_IMAGE_${imageBase64.length}_BYTES]`
    }, headers, requestId);

    const requestStartTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const requestDuration = Date.now() - requestStartTime;
    const responseText = await response.text();
    
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      zapiLogger.logError('JSON_PARSE_ERROR', parseError, requestId);
      zapiLogger.logApiResponse(response.status, response.statusText, responseText, requestDuration, requestId);
      throw new Error(`Resposta inválida da Z-API: ${responseText}`);
    }

    zapiLogger.logApiResponse(response.status, response.statusText, data, requestDuration, requestId);

    if (!response.ok) {
      throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText} - ${JSON.stringify(data)}`);
    }
    
    // Salvar mensagem no banco de dados se conversationId foi fornecido
    if (conversationId) {
      try {
        const messageContent = caption ? `📷 ${caption}` : '📷 Imagem';
        
        await storage.createMessage({
          conversationId: parseInt(conversationId),
          content: dataUrl,
          isFromContact: false,
          messageType: 'image',
          sentAt: new Date(),
          metadata: {
            zaapId: data.messageId || data.id,
            imageSent: true,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            caption: caption
          }
        });

        // Broadcast para WebSocket
        const { broadcast } = await import('../../realtime');
        broadcast(parseInt(conversationId), {
          type: 'message_sent',
          conversationId: parseInt(conversationId)
        });
      } catch (dbError) {
        console.error('❌ Erro ao salvar mensagem de imagem no banco:', dbError);
      }
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Erro ao enviar imagem via Z-API:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}

/**
 * Handler para envio de áudio via Z-API
 */
export async function handleSendAudio(req: Request, res: Response) {
  const startTime = Date.now();
  let requestId: string;
  
  try {
    const phone = req.body.phone;
    const conversationId = req.body.conversationId;
    const duration = req.body.duration;
    
    requestId = zapiLogger.logSendStart(phone, `[AUDIO] ${duration || 'unknown'}s`, undefined);
    
    if (!phone || !req.file) {
      zapiLogger.logError('VALIDATION_ERROR', 'Phone e arquivo de áudio são obrigatórios', requestId);
      return res.status(400).json({ 
        error: 'Phone e arquivo de áudio são obrigatórios' 
      });
    }

    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      zapiLogger.logCredentialsValidation(false, 'env', credentials.error, requestId);
      return res.status(400).json({ error: credentials.error });
    }
    
    zapiLogger.logCredentialsValidation(true, 'env', undefined, requestId);

    const { instanceId, token, clientToken } = credentials;
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Converter arquivo para base64 com prefixo data URL conforme documentação Z-API
    const audioBase64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${audioBase64}`;
    
    const payload = {
      phone: cleanPhone,
      audio: dataUrl
    };

    const url = buildZApiUrl(instanceId, token, 'send-audio');
    console.log('🎵 Enviando áudio para Z-API:', { 
      url: url.replace(token, '****'), 
      phone: cleanPhone,
      audioSize: audioBase64.length,
      mimeType: req.file.mimetype
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: getZApiHeaders(clientToken),
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('📥 Resposta Z-API (áudio):', {
      status: response.status,
      statusText: response.statusText,
      body: responseText.substring(0, 200) + '...'
    });

    if (!response.ok) {
      console.error('❌ Erro na Z-API (áudio):', responseText);
      throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erro ao parsear resposta JSON (áudio):', parseError);
      throw new Error(`Resposta inválida da Z-API: ${responseText}`);
    }

    console.log('✅ Áudio enviado com sucesso via Z-API:', data);
    
    // Salvar mensagem no banco de dados se conversationId foi fornecido
    if (conversationId) {
      try {
        await storage.createMessage({
          conversationId: parseInt(conversationId),
          content: dataUrl,
          isFromContact: false,
          messageType: 'audio',
          sentAt: new Date(),
          metadata: {
            zaapId: data.messageId || data.id,
            audioSent: true,
            duration: duration ? parseFloat(duration) : 0,
            mimeType: req.file.mimetype,
            originalContent: `Áudio (${duration ? Math.floor(parseFloat(duration)) + 's' : 'duração desconhecida'})`
          }
        });

        // Broadcast para WebSocket
        const { broadcast } = await import('../../realtime');
        broadcast(parseInt(conversationId), {
          type: 'message_sent',
          conversationId: parseInt(conversationId)
        });
      } catch (dbError) {
        console.error('❌ Erro ao salvar mensagem de áudio no banco:', dbError);
      }
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Erro ao enviar áudio via Z-API:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}

/**
 * Handler para envio de vídeos via Z-API
 */
export async function handleSendVideo(req: Request, res: Response) {
  try {
    console.log('🎥 Recebendo solicitação de envio de vídeo:', {
      hasPhone: !!req.body.phone,
      hasFile: !!req.file,
      contentType: req.headers['content-type']
    });
    
    const phone = req.body.phone;
    const conversationId = req.body.conversationId;
    const caption = req.body.caption || '';
    
    if (!phone || !req.file) {
      return res.status(400).json({ 
        error: 'Phone e arquivo de vídeo são obrigatórios' 
      });
    }

    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({ error: credentials.error });
    }

    const { instanceId, token, clientToken } = credentials;
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Converter vídeo para base64 (formato esperado pela Z-API)
    const videoBase64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${videoBase64}`;

    const payload = {
      phone: cleanPhone,
      video: dataUrl,
      ...(caption && { caption })
    };

    const url = buildZApiUrl(instanceId, token, 'send-video');
    console.log('🎥 Enviando vídeo para Z-API (base64):', { 
      url: url.replace(token, '****'), 
      phone: cleanPhone,
      videoSize: req.file.buffer.length,
      mimeType: req.file.mimetype,
      hasCaption: !!caption
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken,
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('📥 Resposta Z-API (vídeo):', {
      status: response.status,
      statusText: response.statusText,
      body: responseText.substring(0, 200) + '...'
    });

    if (!response.ok) {
      console.error('❌ Erro na Z-API (vídeo):', responseText);
      throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erro ao parsear resposta JSON (vídeo):', parseError);
      throw new Error(`Resposta inválida da Z-API: ${responseText}`);
    }

    console.log('✅ Vídeo enviado com sucesso via Z-API:', data);
    
    // Salvar mensagem no banco de dados se conversationId foi fornecido
    if (conversationId) {
      try {
        await storage.createMessage({
          conversationId: parseInt(conversationId),
          content: caption || 'Vídeo',
          isFromContact: false,
          messageType: 'video',
          sentAt: new Date(),
          metadata: {
            zaapId: data.messageId || data.id,
            videoSent: true,
            mimeType: req.file.mimetype,
            mediaUrl: dataUrl,
            originalContent: caption || 'Vídeo'
          }
        });

        // Broadcast para WebSocket
        const { broadcast } = await import('../../realtime');
        broadcast(parseInt(conversationId), {
          type: 'message_sent',
          conversationId: parseInt(conversationId)
        });
      } catch (dbError) {
        console.error('❌ Erro ao salvar mensagem de vídeo no banco:', dbError);
      }
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Erro ao enviar vídeo via Z-API:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}

// Configurar multer para upload de documentos
const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de documento não permitido'));
    }
  }
});

/**
 * Handler para envio de documentos via Z-API
 */
export async function handleSendDocument(req: Request, res: Response) {
  try {
    console.log('📄 Recebendo solicitação de envio de documento:', {
      hasPhone: !!req.body.phone,
      hasFile: !!req.file,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      mimeType: req.file?.mimetype,
      contentType: req.headers['content-type']
    });
    
    const phone = req.body.phone;
    const conversationId = req.body.conversationId;
    const caption = req.body.caption || '';
    
    if (!phone || !req.file) {
      return res.status(400).json({ 
        error: 'Phone e arquivo de documento são obrigatórios' 
      });
    }

    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({ error: credentials.error });
    }

    if (!credentials.instanceId || !credentials.token || !credentials.clientToken) {
      return res.status(400).json({ error: 'Credenciais Z-API incompletas' });
    }

    const { instanceId, token, clientToken } = credentials;
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Converter documento para base64
    const documentBase64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${documentBase64}`;
    
    const payload = {
      phone: cleanPhone,
      document: dataUrl,
      fileName: req.file.originalname,
      ...(caption && { caption })
    };

    const url = buildZApiUrl(instanceId, token, 'send-document');
    console.log('📄 Enviando documento para Z-API:', { 
      url: url.replace(token, '****'), 
      phone: cleanPhone,
      fileName: req.file.originalname,
      documentSize: req.file.buffer.length,
      mimeType: req.file.mimetype,
      hasCaption: !!caption
    });

    // Usar timeout personalizado para documentos grandes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 180000); // 3 minutos para documentos

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': clientToken,
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      console.log('📥 Resposta Z-API (documento):', {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 200) + '...'
      });

      if (!response.ok) {
        console.error('❌ Erro na Z-API (documento):', responseText);
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON (documento):', parseError);
        throw new Error(`Resposta inválida da Z-API: ${responseText}`);
      }

      console.log('✅ Documento enviado com sucesso via Z-API:', data);
      
      // Salvar mensagem no banco de dados se conversationId foi fornecido
      if (conversationId) {
        try {
          await storage.createMessage({
            conversationId: parseInt(conversationId),
            content: caption || req.file.originalname,
            isFromContact: false,
            messageType: 'document',
            sentAt: new Date(),
            metadata: {
              zaapId: data.messageId || data.id,
              documentSent: true,
              fileName: req.file.originalname,
              mimeType: req.file.mimetype,
              fileSize: req.file.size,
              originalContent: caption || req.file.originalname
            }
          });

          // Broadcast para WebSocket
          const { broadcast } = await import('../../realtime');
          broadcast(parseInt(conversationId), {
            type: 'message_sent',
            conversationId: parseInt(conversationId)
          });
        } catch (dbError) {
          console.error('❌ Erro ao salvar mensagem de documento no banco:', dbError);
        }
      }

      res.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Timeout: Documento muito grande ou conexão lenta');
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('❌ Erro ao enviar documento via Z-API:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}

/**
 * Handler para envio de links via Z-API
 */
export async function handleSendLink(req: Request, res: Response) {
  try {
    console.log('🔗 Recebendo solicitação de envio de link:', req.body);
    
    const { phone, url: linkUrl, text, conversationId } = req.body;
    
    if (!phone || !linkUrl) {
      return res.status(400).json({ 
        error: 'Phone e URL são obrigatórios' 
      });
    }

    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({ error: credentials.error });
    }

    const { instanceId, token, clientToken } = credentials;
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Preparar payload para Z-API
    const payload = {
      phone: cleanPhone,
      message: text || linkUrl
    };

    const url = buildZApiUrl(instanceId, token, 'send-text');
    console.log('🔗 Enviando link via Z-API:', { 
      url: url.replace(token, '****'), 
      phone: cleanPhone,
      linkUrl,
      hasText: !!text
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken,
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('📥 Resposta Z-API (link):', {
      status: response.status,
      statusText: response.statusText,
      body: responseText.substring(0, 200) + '...'
    });

    if (!response.ok) {
      console.error('❌ Erro na Z-API (link):', responseText);
      throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erro ao parsear resposta JSON (link):', parseError);
      throw new Error(`Resposta inválida da Z-API: ${responseText}`);
    }

    console.log('✅ Link enviado com sucesso via Z-API:', data);
    
    // Salvar mensagem no banco de dados se conversationId foi fornecido
    if (conversationId) {
      try {
        await storage.createMessage({
          conversationId: parseInt(conversationId),
          content: text || linkUrl,
          isFromContact: false,
          messageType: 'text',
          sentAt: new Date(),
          metadata: {
            zaapId: data.messageId || data.id,
            linkSent: true,
            linkUrl: linkUrl,
            originalContent: text || linkUrl
          }
        });

        // Broadcast para WebSocket
        const { broadcast } = await import('../../realtime');
        broadcast(parseInt(conversationId), {
          type: 'message_sent',
          conversationId: parseInt(conversationId)
        });
      } catch (dbError) {
        console.error('❌ Erro ao salvar mensagem de link no banco:', dbError);
      }
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Erro ao enviar link via Z-API:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}

/**
 * Obtém status da conexão Z-API - CONSOLIDADO do arquivo principal
 */
async function handleGetStatus(req: any, res: any) {
  try {
    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({ error: credentials.error });
    }

    const { instanceId, token, clientToken } = credentials;
    const url = buildZApiUrl(instanceId, token, 'status');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getZApiHeaders(clientToken)
    });

    if (!response.ok) {
      throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}

/**
 * Registra rotas Z-API consolidadas - mídia e status
 */
export function registerZApiMediaRoutes(app: Express) {
  // Rotas de mídia
  app.post('/api/zapi/send-image', uploadImage.single('image'), handleSendImage);
  app.post('/api/zapi/send-audio', uploadAudio.single('audio'), handleSendAudio);
  app.post('/api/zapi/send-video', uploadVideo.single('video'), handleSendVideo);
  app.post('/api/zapi/send-document', uploadDocument.single('document'), handleSendDocument);
  app.post('/api/zapi/send-link', handleSendLink);
  
  // Rota de status consolidada
  app.get('/api/zapi/status', handleGetStatus);
}