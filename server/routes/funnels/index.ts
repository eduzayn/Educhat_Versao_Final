import { Express } from 'express';
import baseRouter from './base';
import teamRouter from './team';
import stagesRouter from './stages';

export function registerFunnelRoutes(app: Express) {
  // Rotas base
  app.use('/api/funnels', baseRouter);

  // Rotas de funis por equipe
  app.use('/api/funnels/team', teamRouter);

  // Rotas de estágios
  app.use('/api/funnels/stages', stagesRouter);
}