/**
 * Z-API Webhook Handler - Consolidado do arquivo principal
 * Responsável por processar webhooks e envio de mensagens via Z-API
 */

import type { Request, Response, Express } from "express";
import { storage } from "../../storage"";
import multer from "multer";
import { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from "../../../utils/zapi";
import { extractMediaUrl, normalizeMessageMetadata } from "../../../utils/mediaUrlExtractor";

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
  try {
    console.log('🖼️ Recebendo solicitação de envio de imagem:', {
      hasPhone: !!req.body.phone,
      hasFile: !!req.file,
      contentType: req.headers['content-type']
    });
    
    const phone = req.body.phone;
    const conversationId = req.body.conversationId;
    const caption = req.body.caption || '';
    
    if (!phone || !req.file) {
      return res.status(400).json({ 
        error: 'Phone e arquivo de imagem são obrigatórios' 
      });
    }

    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({ error: credentials.error });
    }

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
    console.log('🖼️ Enviando imagem para Z-API:', { 
      url: url.replace(token, '****'), 
      phone: cleanPhone,
      imageSize: imageBase64.length,
      mimeType: req.file.mimetype,
      hasCaption: !!caption
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: getZApiHeaders(clientToken),
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('📥 Resposta Z-API (imagem):', {
      status: response.status,
      statusText: response.statusText,
      body: responseText.substring(0, 200) + '...'
    });

    if (!response.ok) {
      console.error('❌ Erro na Z-API (imagem):', responseText);
      throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erro ao parsear resposta JSON (imagem):', parseError);
      throw new Error(`Resposta inválida da Z-API: ${responseText}`);
    }

    console.log('✅ Imagem enviada com sucesso via Z-API:', data);
    
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
  try {
    console.log('🎵 Recebendo solicitação de envio de áudio:', {
      hasPhone: !!req.body.phone,
      hasFile: !!req.file,
      contentType: req.headers['content-type']
    });
    
    const phone = req.body.phone;
    const conversationId = req.body.conversationId;
    const duration = req.body.duration;
    
    if (!phone || !req.file) {
      return res.status(400).json({ 
        error: 'Phone e arquivo de áudio são obrigatórios' 
      });
    }

    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({ error: credentials.error });
    }

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

/**
 * Registra rotas Z-API relacionadas a mídia
 */
export function registerZApiMediaRoutes(app: Express) {
  app.post('/api/zapi/send-image', uploadImage.single('image'), handleSendImage);
  app.post('/api/zapi/send-audio', uploadAudio.single('audio'), handleSendAudio);
  app.post('/api/zapi/send-video', uploadVideo.single('video'), handleSendVideo);
}