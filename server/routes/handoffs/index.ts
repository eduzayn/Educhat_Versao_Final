import { Router } from 'express';
import baseRouter from './base';
import pendingRouter from './pending';
import statsRouter from './stats';
import roundRobinRouter from './round-robin';

const router = Router();

// Rotas base
router.use('/', baseRouter);

// Rotas de handoffs pendentes
router.use('/pending', pendingRouter);

// Rotas de estatísticas
router.use('/stats', statsRouter);

// Rotas de rodízio equitativo
router.use('/round-robin', roundRobinRouter);

export default router;