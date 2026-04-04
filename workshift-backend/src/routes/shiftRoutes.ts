import { Router } from 'express';
import {
  createShift,
  createShiftsBulk,
  deleteShift,
  getAvailableShifts,
  getShiftRecommendations,
  listShifts,
  lockShift,
} from '../controllers/shiftController';
import { requireAuth } from '../middleware/authJwt';
import { validateBody } from '../middleware/validateBody';
import { validateQuery } from '../middleware/validateQuery';
import {
  createShiftBulkSchema,
  createShiftSchema,
  shiftsListQuerySchema,
} from '../validation/shiftPhaseSchemas';
import { shiftRecommendationsQuerySchema } from '../validation/phaseGSchemas';

const router = Router({ mergeParams: true });

router.get('/available', requireAuth, getAvailableShifts);
router.get('/', requireAuth, validateQuery(shiftsListQuerySchema), listShifts);
router.post('/bulk', requireAuth, validateBody(createShiftBulkSchema), createShiftsBulk);
router.post('/', requireAuth, validateBody(createShiftSchema), createShift);
router.get(
  '/:shiftId/recommendations',
  requireAuth,
  validateQuery(shiftRecommendationsQuerySchema),
  getShiftRecommendations
);
router.delete('/:shiftId', requireAuth, deleteShift);
router.patch('/:shiftId/lock', requireAuth, lockShift);

export default router;
