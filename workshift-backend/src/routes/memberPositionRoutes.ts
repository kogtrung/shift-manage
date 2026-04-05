import { Router } from 'express';
import { getMyPositions, putMyPositions } from '../controllers/memberPositionController';
import { requireAuth } from '../middleware/authJwt';
import { validateBody } from '../middleware/validateBody';
import { putMyPositionsSchema } from '../validation/phaseESchemas';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, getMyPositions);
router.put('/', requireAuth, validateBody(putMyPositionsSchema), putMyPositions);

export default router;
