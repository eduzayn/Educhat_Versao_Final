import { Router } from 'express';
import { registerAssignTeamRoutes } from './assignTeam';
import { registerAssignUserRoutes } from './assignUser';

const router = Router();

// Registrar rotas de atribuição
registerAssignTeamRoutes(router);
registerAssignUserRoutes(router);

export default router;