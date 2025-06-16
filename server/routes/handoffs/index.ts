import { Router } from 'express';
import baseRouter from './routes/base';
import intelligentRouter from './routes/intelligent';
import pendingRouter from './routes/pending';
import statsRouter from './routes/stats';

const router = Router();

// Rotas base
router.use('/', baseRouter);

// Rotas de handoff inteligente
router.use('/intelligent', intelligentRouter);

// Rotas de handoffs pendentes
router.use('/pending', pendingRouter);

// Rotas de estatísticas
router.use('/stats', statsRouter);

export default router;