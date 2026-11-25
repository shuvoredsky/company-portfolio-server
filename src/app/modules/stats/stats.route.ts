import { Router } from 'express';
import auth from '../../middlewares/auth';
import { noStoreCache } from '../../middlewares/cacheControl';
import { StatsController } from './stats.controller';

const router = Router();

router.get('/stats', noStoreCache, auth('admin'), StatsController.getAdminStats);

export const StatsRoutes = router;
