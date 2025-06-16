import { Router } from 'express';
import basicOperations from './basic-operations';
import stages from './stages';
import attachments from './attachments';

const router = Router();

// Registrar rotas
router.use('/', basicOperations);
router.use('/', stages);
router.use('/', attachments);

export default router;