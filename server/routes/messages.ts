import { Router, Request, Response } from 'express';

const router = Router();

// Rota para buscar áudio de uma mensagem
router.get('/:messageId/audio', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    
    if (!messageId) {
      return res.status(400).json({ error: 'ID da mensagem é obrigatório' });
    }

    const { storage } = await import('../storage');
    const message = await storage.messages.getMessage(parseInt(messageId));
    
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    if (message.messageType !== 'audio') {
      return res.status(400).json({ error: 'Mensagem não é do tipo áudio' });
    }

    // Para mensagens de áudio Z-API, retornamos informações para reprodução
    if (message.metadata && (message.metadata as any).zaapId) {
      return res.json({
        success: true,
        audioUrl: null, // Z-API não fornece URL direta
        messageType: 'audio',
        metadata: message.metadata,
        canPlay: false, // Indicar que não pode reproduzir diretamente
        message: 'Áudio enviado via WhatsApp'
      });
    }

    // Para outros tipos de áudio (se houver), buscar URL real
    res.status(404).json({ error: 'Áudio não disponível para reprodução' });
    
  } catch (error) {
    console.error('Erro ao buscar áudio:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;