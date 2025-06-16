import { Express } from 'express';
import statsRouter from './routes/stats';
import logsRouter from './routes/logs';
import testRouter from './routes/test';
import contextsRouter from './routes/contexts';
import uploadRouter from './routes/upload';
import memoryListRouter from './routes/memory/list';
import memoryOperationsRouter from './routes/memory/operations';
import memorySearchRouter from './routes/memory/search';

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

  // Rotas de memória
  app.use('/api/ia/memory', memoryListRouter);
  app.use('/api/ia/memory', memoryOperationsRouter);
  app.use('/api/ia/memory', memorySearchRouter);
}