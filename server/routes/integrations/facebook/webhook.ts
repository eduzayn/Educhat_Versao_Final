import { Request, Response, Router } from 'express';
import { storage } from '../../../storage';

const router = Router();

// Buscar logs de webhook
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

export default router; 