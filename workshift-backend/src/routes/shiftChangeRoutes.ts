import { Router } from 'express';
import {
  approveShiftChange,
  createShiftChangeRequest,
  listPendingShiftChanges,
  rejectShiftChange,
} from '../controllers/shiftChangeController';
import { requireAuth } from '../middleware/authJwt';
import { validateBody } from '../middleware/validateBody';
import {
  createShiftChangeRequestSchema,
  emptyObjectSchemaH,
  rejectShiftChangeSchema,
} from '../validation/phaseHSchemas';

const router = Router({ mergeParams: true });

router.post('/', requireAuth, validateBody(createShiftChangeRequestSchema), createShiftChangeRequest);
router.get('/pending', requireAuth, listPendingShiftChanges);
router.patch(
  '/:requestId/approve',
  requireAuth,
  validateBody(emptyObjectSchemaH),
  approveShiftChange
);
router.patch(
  '/:requestId/reject',
  requireAuth,
  validateBody(rejectShiftChangeSchema),
  rejectShiftChange
);

export default router;
