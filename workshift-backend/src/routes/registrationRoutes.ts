import { Router } from 'express';
import {
  approveRegistration,
  cancelRegistration,
  rejectRegistration,
} from '../controllers/registrationActionController';
import { requireAuth } from '../middleware/authJwt';
import { validateBody } from '../middleware/validateBody';
import {
  cancelRegistrationSchema,
  emptyObjectSchema,
  rejectRegistrationSchema,
} from '../validation/registrationSchemas';

const router = Router();

router.patch(
  '/:registrationId/approve',
  requireAuth,
  validateBody(emptyObjectSchema),
  approveRegistration
);
router.patch(
  '/:registrationId/reject',
  requireAuth,
  validateBody(rejectRegistrationSchema),
  rejectRegistration
);
router.patch(
  '/:registrationId/cancel',
  requireAuth,
  validateBody(cancelRegistrationSchema),
  cancelRegistration
);

export default router;
