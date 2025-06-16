import { Router } from 'express';
import statsRouter from './routes/stats';
import logsRouter from './routes/logs';
import testRouter from './routes/test';
import contextsRouter from './routes/contexts';
import uploadRouter from './routes/upload';
import memoryListRouter from './routes/memory/list';
import memoryOperationsRouter from './routes/memory/operations';
import memorySearchRouter from './routes/memory/search';

const router = Router();

// Rotas de estatísticas
router.use('/stats', statsRouter);

// Rotas de logs
router.use('/logs', logsRouter);

// Rotas de teste
router.use('/test', testRouter);

// Rotas de contextos
router.use('/contexts', contextsRouter);

// Rotas de upload
router.use('/upload-training', uploadRouter);

// Rotas de memória
router.use('/memory', memoryListRouter);
router.use('/memory', memoryOperationsRouter);
router.use('/memory', memorySearchRouter);

export default router;