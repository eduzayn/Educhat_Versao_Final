import { Router } from 'express';
import baseRouter from './base';
import pendingRouter from './pending';
import statsRouter from './stats';
import roundRobinRouter from './round-robin';
import intelligentRouter from './intelligent';

const router = Router();

// Rotas base
router.use('/', baseRouter);

// Rotas de handoffs pendentes
router.use('/pending', pendingRouter);

// Rotas de estatísticas
router.use('/stats', statsRouter);

// Rotas de rodízio equitativo
router.use('/round-robin', roundRobinRouter);

// Rotas de atribuição inteligente
router.use('/intelligent', intelligentRouter);

export default router;