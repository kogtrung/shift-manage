import { Router } from 'express';
import { getUnderstaffedAlerts } from '../controllers/understaffedAlertController';
import { requireAuth } from '../middleware/authJwt';

const router = Router({ mergeParams: true });

router.get('/understaffed', requireAuth, getUnderstaffedAlerts);

export default router;
