import { Express } from 'express';
import baseRouter from './base';
import intelligentRouter from './intelligent';
import pendingRouter from './pending';
import statsRouter from './stats';

export function registerHandoffRoutes(app: Express) {
  // Rotas base
  app.use('/api/handoffs', baseRouter);

  // Rotas de handoffs inteligentes
  app.use('/api/handoffs/intelligent', intelligentRouter);

  // Rotas de handoffs pendentes
  app.use('/api/handoffs/pending', pendingRouter);

  // Rotas de estatísticas
  app.use('/api/handoffs/stats', statsRouter);
}