import { Express } from 'express';
import statsRouter from './routes/stats';
import logsRouter from './routes/logs';
import testRouter from './routes/test';
import contextsRouter from './routes/contexts';
import uploadRouter from './routes/upload';

export function registerIARoutes(app: Express) {
  // Rotas de estatísticas
  app.use('/api/ia/stats', statsRouter);

  // Rotas de logs
  app.use('/api/ia/logs', logsRouter);

  // Rotas de teste
  app.use('/api/ia/test', testRouter);

  // Rotas de contextos
  app.use('/api/ia/contexts', contextsRouter);

  // Rotas de upload
  app.use('/api/ia/upload-training', uploadRouter);
}