import { Router } from 'express';
import { getMyCalendar } from '../controllers/meController';
import { requireAuth } from '../middleware/authJwt';
import { validateQuery } from '../middleware/validateQuery';
import { meCalendarQuerySchema } from '../validation/phaseESchemas';

const router = Router();

router.get('/calendar', requireAuth, validateQuery(meCalendarQuerySchema), getMyCalendar);

export default router;
