import { Request, Response, Router } from 'express';
import { AuthenticatedRequest } from '../../../core/permissionsRefactored';
import { upload } from '../config/upload';
import { zapiLogger } from '../../../utils/zapiLogger';

const router = Router();

// Upload de arquivos de mídia
router.post('/upload', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const conversationId = req.body.conversationId;
    const caption = req.body.caption || '';

    if (!conversationId) {
      return res.status(400).json({ error: 'ID da conversa é obrigatório' });
    }

    const fileUrl = `/uploads/media/${req.file.filename}`;
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 
                    req.file.mimetype.startsWith('video/') ? 'video' : 
                    req.file.mimetype.startsWith('audio/') ? 'audio' : 'document';

    // Salvar mensagem no banco de dados
    const { storage } = await import('../../../storage');
    
    const messageData = {
      conversationId: parseInt(conversationId),
      content: caption || `${fileType === 'image' ? 'Imagem' : fileType === 'video' ? 'Vídeo' : fileType === 'audio' ? 'Áudio' : 'Documento'} enviado`,
      isFromContact: false,
      messageType: fileType,
      status: 'sent',
      metadata: {
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileType
      }
    };

    console.log('📎 Salvando mensagem de mídia:', {
      conversationId,
      fileType,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });

    const savedMessage = await storage.createMessage(messageData);

    // Resposta imediata para frontend (não espera Z-API)
    res.json({
      fileUrl,
      originalName: req.file.originalname,
      fileType,
      size: req.file.size,
      mimeType: req.file.mimetype,
      message: savedMessage
    });

    // ENVIO VIA Z-API EM BACKGROUND (não bloqueia resposta)
    setImmediate(async () => {
      try {
        // Buscar dados da conversa para obter o telefone do contato
        const conversation = await storage.getConversation(parseInt(conversationId));
        if (conversation?.contact?.phone) {
          const { validateZApiCredentials, buildZApiUrl } = await import('../../../utils/zapi');
          const credentials = validateZApiCredentials();
          
          if (credentials.valid) {
            const { instanceId, token, clientToken } = credentials;
            const cleanPhone = conversation.contact.phone.replace(/\D/g, '');
          
          // Converter arquivo para base64 de forma otimizada (não bloqueia resposta)
          const fs = await import('fs');
          const path = await import('path');
          const filePath = path.join(process.cwd(), 'uploads', 'media', req.file.filename);
          
          // Para arquivos grandes (>1MB), usar processamento assíncrono
          let dataUrl: string;
          if (req.file.size > 1024 * 1024) {
            const fileBuffer = await fs.promises.readFile(filePath);
            dataUrl = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
          } else {
            const fileBuffer = fs.readFileSync(filePath);
            dataUrl = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
          }
          
          let endpoint = '';
          let payload: any = {
            phone: cleanPhone
          };
          
          // Definir endpoint e payload baseado no tipo de arquivo
          if (fileType === 'image') {
            endpoint = 'send-image';
            payload.image = dataUrl;
            if (caption) payload.caption = caption;
          } else if (fileType === 'video') {
            endpoint = 'send-video';
            payload.video = dataUrl;
            if (caption) payload.caption = caption;
          } else if (fileType === 'audio') {
            endpoint = 'send-audio';
            payload.audio = dataUrl;
          } else {
            endpoint = 'send-document';
            payload.document = dataUrl;
            payload.fileName = req.file.originalname;
            if (caption) payload.caption = caption;
          }
          
          const url = buildZApiUrl(instanceId, token, endpoint);
          
          console.log(`📤 Enviando ${fileType} via Z-API para ${cleanPhone}`);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Client-Token': clientToken,
            },
            body: JSON.stringify(payload)
          });
          
          if (response.ok) {
            const zapiData = await response.json();
            console.log(`✅ ${fileType} enviado com sucesso via Z-API`);
            
            // Atualizar mensagem com ID da Z-API
            const currentMetadata = savedMessage.metadata as Record<string, any> || {};
            const updatedMetadata = { 
              ...currentMetadata, 
              zaapId: zapiData.messageId || zapiData.id, 
              sentViaZapi: true 
            };
            
            await storage.updateMessage(savedMessage.id, {
              metadata: updatedMetadata
            });
          } else {
            const errorText = await response.text();
            console.error(`❌ Erro ao enviar ${fileType} via Z-API:`, errorText);
          }
          } else {
            console.warn('⚠️ Credenciais Z-API não configuradas, mídia salva apenas localmente');
          }
        } else {
          console.warn('⚠️ Telefone do contato não encontrado, mídia salva apenas localmente');
        }
      } catch (zapiError) {
        console.error('❌ Erro na integração Z-API:', zapiError);
      }
    });

    // Broadcast via WebSocket
    const { broadcast } = await import('../../realtime');
    broadcast(parseInt(conversationId), {
      type: 'message_sent',
      conversationId: parseInt(conversationId),
      message: savedMessage
    });

    res.json({
      fileUrl,
      originalName: req.file.originalname,
      fileType,
      size: req.file.size,
      mimeType: req.file.mimetype,
      message: savedMessage
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro no upload do arquivo' });
  }
});

export default router; 