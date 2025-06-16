import { Request, Response } from 'express';
import crypto from 'crypto';
import { storage } from "../../storage";

/**
 * Verificar assinatura do webhook Facebook
 */
export function verifyFacebookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * GET /api/webhooks/facebook - Verificação do webhook
 */
export async function handleWebhookVerification(req: Request, res: Response) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe') {
    try {
      // Buscar integração ativa para verificar o token
      const activeIntegration = await storage.facebook.getActiveIntegration();
      
      if (activeIntegration && token === activeIntegration.webhookVerifyToken) {
        console.log('✅ Webhook Facebook verificado com sucesso');
        res.status(200).send(challenge);
      } else {
        console.log('❌ Token de verificação Facebook inválido');
        res.status(403).json({ error: 'Token de verificação inválido' });
      }
    } catch (error) {
      console.error('❌ Erro na verificação do webhook Facebook:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.status(400).json({ error: 'Modo de verificação inválido' });
  }
} 