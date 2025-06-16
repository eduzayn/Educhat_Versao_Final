import { Express } from 'express';
import baseRouter from './routes/base';
import teamRouter from './routes/team';
import stagesRouter from './routes/stages';

export function registerFunnelRoutes(app: Express) {
  // Rotas base
  app.use('/api/funnels', baseRouter);

  // Rotas de equipe
  app.use('/api/funnels', teamRouter);

  // Rotas de estágios
  app.use('/api/funnels', stagesRouter);
}