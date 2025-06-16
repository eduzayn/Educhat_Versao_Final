import { Express } from 'express';
import integrationRouter from './integration';
import messagesRouter from './messages';
import webhookRouter from './webhook';

export function registerFacebookRoutes(app: Express) {
  // Rotas de integração
  app.use('/api/integrations/facebook', integrationRouter);

  // Rotas de mensagens e comentários
  app.use('/api/integrations/facebook', messagesRouter);

  // Rotas de webhook
  app.use('/api/integrations/facebook', webhookRouter);
} 