import { Router } from 'express';
import metricsRouter from './metrics';
import channelsRouter from './channels';
import conversationsRouter from './conversations';

const router = Router();

// Registrando as rotas
router.use(metricsRouter);
router.use(channelsRouter);
router.use(conversationsRouter);

export default router;