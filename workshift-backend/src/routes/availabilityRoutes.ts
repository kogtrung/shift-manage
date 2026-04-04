import { Router } from 'express';
import { getAvailability, putAvailability } from '../controllers/availabilityController';
import { requireAuth } from '../middleware/authJwt';
import { validateBody } from '../middleware/validateBody';
import { putAvailabilitySchema } from '../validation/phaseESchemas';

const router = Router();

router.get('/', requireAuth, getAvailability);
router.put('/', requireAuth, validateBody(putAvailabilitySchema), putAvailability);

export default router;
