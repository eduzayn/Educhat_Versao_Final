import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { storage } from '../../../storage';
import { sendMessageSchema, replyCommentSchema } from './types';

const router = Router();

// Testar conexão
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { accessToken } = testConnectionSchema.parse(req.body);
    
    const result = await storage.facebook.testFacebookConnection(accessToken);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('❌ Erro ao testar conexão Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar mensagem
router.post('/send-message', async (req: Request, res: Response) => {
  try {
    const { recipientId, message, platform } = sendMessageSchema.parse(req.body);
    
    const activeIntegration = await storage.facebook.getActiveIntegration();
    if (!activeIntegration) {
      return res.status(400).json({ error: 'Nenhuma integração Facebook ativa encontrada' });
    }
    
    if (!activeIntegration.accessToken) {
      return res.status(400).json({ error: 'Token de acesso não configurado' });
    }
    
    const result = await storage.facebook.sendMessage(
      activeIntegration.accessToken,
      recipientId,
      message,
      platform
    );
    
    res.json({ success: true, result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('❌ Erro ao enviar mensagem Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Responder comentário
router.post('/reply-comment', async (req: Request, res: Response) => {
  try {
    const { commentId, message } = replyCommentSchema.parse(req.body);
    
    const activeIntegration = await storage.facebook.getActiveIntegration();
    if (!activeIntegration) {
      return res.status(400).json({ error: 'Nenhuma integração Facebook ativa encontrada' });
    }
    
    if (!activeIntegration.accessToken) {
      return res.status(400).json({ error: 'Token de acesso não configurado' });
    }
    
    const result = await storage.facebook.replyToComment(
      activeIntegration.accessToken,
      commentId,
      message
    );
    
    res.json({ success: true, result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('❌ Erro ao responder comentário Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 