import { Router } from 'express';
import { getMonthlyReport, getWeeklyReport } from '../controllers/activityReportController';
import { requireAuth } from '../middleware/authJwt';
import { validateQuery } from '../middleware/validateQuery';
import { monthlyReportQuerySchema, weeklyReportQuerySchema } from '../validation/phaseHSchemas';

const router = Router({ mergeParams: true });

router.get('/weekly', requireAuth, validateQuery(weeklyReportQuerySchema), getWeeklyReport);
router.get('/monthly', requireAuth, validateQuery(monthlyReportQuerySchema), getMonthlyReport);

export default router;
