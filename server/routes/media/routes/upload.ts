import { Request, Response, Router } from 'express';
import { AuthenticatedRequest } from '../../../permissions';
import { upload } from '../config/upload';

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