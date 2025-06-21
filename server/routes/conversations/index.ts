import { Router } from 'express';
import { registerAssignTeamRoutes } from './assignTeam';
import { registerAssignUserRoutes } from './assignUser';
import inboxConversationsRouter from '../inbox/conversations';

const router = Router();

// Consolidação: Integrar rotas do inbox com rotas de atribuição
router.use('/', inboxConversationsRouter);

// Registrar rotas de atribuição
registerAssignTeamRoutes(router);
registerAssignUserRoutes(router);

export default router;