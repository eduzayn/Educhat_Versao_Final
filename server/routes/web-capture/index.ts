import { Router } from 'express';
import singleCaptureRouter from './web-capture-single';
import batchCaptureRouter from './web-capture-batch';

const router = Router();

router.use('/', singleCaptureRouter);
router.use('/', batchCaptureRouter);

export default router;