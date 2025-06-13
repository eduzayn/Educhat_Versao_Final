import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { storage } from "../../storage";
import { insertFacebookIntegrationSchema } from '../../../shared/schema';

const router = Router();

// Validation schemas
const facebookIntegrationSchema = insertFacebookIntegrationSchema.extend({
  webhookVerifyToken: z.string().min(10, 'Token de verificação deve ter pelo menos 10 caracteres')
});

const testConnectionSchema = z.object({
  accessToken: z.string().min(1, 'Access Token é obrigatório')
});

const sendMessageSchema = z.object({
  recipientId: z.string().min(1, 'ID do destinatário é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  platform: z.enum(['facebook', 'instagram']).default('facebook')
});

const replyCommentSchema = z.object({
  commentId: z.string().min(1, 'ID do comentário é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória')
});

// GET /api/integrations/facebook - Listar integrações
router.get('/', async (req: Request, res: Response) => {
  try {
    const integrations = await storage.facebook.getIntegrations();
    res.json(integrations);
  } catch (error) {
    console.error('❌ Erro ao buscar integrações Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/integrations/facebook/:id - Buscar integração específica
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const integration = await storage.facebook.getIntegration(id);
    if (!integration) {
      return res.status(404).json({ error: 'Integração não encontrada' });
    }

    res.json(integration);
  } catch (error) {
    console.error('❌ Erro ao buscar integração Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/integrations/facebook - Criar nova integração
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = facebookIntegrationSchema.parse(req.body);
    
    const integration = await storage.facebook.createIntegration(validatedData);
    res.status(201).json(integration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('❌ Erro ao criar integração Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/integrations/facebook/:id - Atualizar integração
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const validatedData = facebookIntegrationSchema.partial().parse(req.body);
    
    const integration = await storage.facebook.updateIntegration(id, validatedData);
    res.json(integration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('❌ Erro ao atualizar integração Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/integrations/facebook/:id - Remover integração
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    await storage.facebook.deleteIntegration(id);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro ao remover integração Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/integrations/facebook/test - Testar conexão
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

// PUT /api/integrations/facebook/:id/status - Ativar/desativar integração
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Status deve ser um boolean' });
    }

    await storage.facebook.updateIntegrationStatus(id, isActive);
    res.json({ success: true, message: `Integração ${isActive ? 'ativada' : 'desativada'} com sucesso` });
  } catch (error) {
    console.error('❌ Erro ao atualizar status da integração Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/integrations/facebook/send-message - Enviar mensagem
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

// POST /api/integrations/facebook/reply-comment - Responder comentário
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

// GET /api/integrations/facebook/webhook-logs - Buscar logs de webhook
router.get('/webhook-logs', async (req: Request, res: Response) => {
  try {
    const integrationId = req.query.integrationId ? parseInt(req.query.integrationId as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    const logs = await storage.facebook.getWebhookLogs(integrationId, limit);
    res.json(logs);
  } catch (error) {
    console.error('❌ Erro ao buscar logs de webhook Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export { router as facebookRoutes };