import { Router } from 'express';
import { storage } from '../../../storage';
import { extractMediaUrl, isValidMediaUrl } from '../../../utils/mediaUrlExtractor';

const router = Router();

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
      'Cache-Control': 'public, max-age=7200, immutable'
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

export default router; 