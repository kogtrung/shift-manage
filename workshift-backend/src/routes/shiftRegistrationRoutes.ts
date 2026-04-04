import { Router } from 'express';
import {
  assignToShift,
  listPendingRegistrations,
  registerForShift,
} from '../controllers/shiftRegistrationController';
import { requireAuth } from '../middleware/authJwt';
import { validateBody } from '../middleware/validateBody';
import { assignShiftSchema, registerShiftSchema } from '../validation/registrationSchemas';

const router = Router({ mergeParams: true });

router.post('/register', requireAuth, validateBody(registerShiftSchema), registerForShift);
router.get('/registrations/pending', requireAuth, listPendingRegistrations);
router.post('/assign', requireAuth, validateBody(assignShiftSchema), assignToShift);

export default router;
