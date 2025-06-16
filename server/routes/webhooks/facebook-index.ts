import { Router } from 'express';
import { handleWebhookVerification } from './facebook-verification';
import { handleWebhook } from './facebook-messaging';

const router = Router();

// Rota de verificação do webhook
router.get('/', handleWebhookVerification);

// Rota de recebimento de webhooks
router.post('/', handleWebhook);

export { router as facebookWebhookRoutes }; 