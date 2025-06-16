import { Router } from 'express';
import uploadRouter from './upload';
import searchRouter from './search';
import processedRouter from './processed';
import statsRouter from './stats';
import recentRouter from './recent';

const router = Router();

router.use(uploadRouter);
router.use(searchRouter);
router.use(processedRouter);
router.use(statsRouter);
router.use(recentRouter);

export default router;