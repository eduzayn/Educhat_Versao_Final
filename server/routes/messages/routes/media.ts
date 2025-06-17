import { Router } from 'express';
import { storage } from '../../../storage';
import { extractMediaUrl, isValidMediaUrl } from '../../../utils/mediaUrlExtractor';
import multer from 'multer';
import { AuthenticatedRequest } from '../../../core/permissionsRefactored';

const router = Router();

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

router.get('/api/messages/:id/media', async (req, res) => {
  const startTime = Date.now();
  try {
    const messageId = parseInt(req.params.id);
    console.log(`🚀 Carregamento sob demanda solicitado para mensagem ${messageId}`);
    const message = await storage.getMessage(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    const mediaTypes = ['image', 'audio', 'video', 'document'];
    if (!message.messageType || !mediaTypes.includes(message.messageType as string)) {
      return res.status(400).json({ error: 'Mensagem não é de mídia' });
    }
    const mediaInfo = extractMediaUrl(
      message.messageType as string,
      message.content,
      message.metadata
    );
    if (!mediaInfo.mediaUrl || !isValidMediaUrl(mediaInfo.mediaUrl)) {
      return res.status(404).json({ error: 'URL da mídia não encontrada ou inválida' });
    }
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'public, max-age=3600'
    });
    const duration = Date.now() - startTime;
    res.json({
      content: mediaInfo.mediaUrl,
      fileName: mediaInfo.fileName,
      mimeType: mediaInfo.mimeType,
      duration: mediaInfo.duration,
      messageType: message.messageType,
      metadata: message.metadata,
      loadTime: `${duration}ms`
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para upload de áudio
router.post('/api/messages/upload-audio', uploadAudio.single('audio'), async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🎵 Recebendo upload de áudio:', {
      hasFile: !!req.file,
      hasConversationId: !!req.body.conversationId,
      contentType: req.headers['content-type']
    });

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo de áudio enviado' });
    }

    const conversationId = req.body.conversationId;
    const duration = req.body.duration;

    if (!conversationId) {
      return res.status(400).json({ error: 'ID da conversa é obrigatório' });
    }

    // Verificar se a conversa existe
    const conversation = await storage.conversation.getConversation(parseInt(conversationId));
    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    // Converter arquivo para base64 com prefixo data URL
    const audioBase64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${audioBase64}`;

    // Salvar mensagem no banco de dados
    const message = await storage.createMessage({
      conversationId: parseInt(conversationId),
      content: dataUrl,
      isFromContact: false,
      messageType: 'audio',
      sentAt: new Date(),
      metadata: {
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
      conversationId: parseInt(conversationId),
      message
    });

    console.log('✅ Áudio salvo com sucesso no banco de dados');

    res.json({
      success: true,
      message: 'Áudio enviado com sucesso',
      messageId: message.id
    });

  } catch (error) {
    console.error('❌ Erro ao fazer upload de áudio:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
});

export default router; 