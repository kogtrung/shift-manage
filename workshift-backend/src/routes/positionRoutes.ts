import { Router } from 'express';
import { createPosition, deletePosition, getPositions, updatePosition } from '../controllers/positionController';
import { requireAuth } from '../middleware/authJwt';
import { validateBody } from '../middleware/validateBody';
import { createPositionSchema, updatePositionSchema } from '../validation/shiftPhaseSchemas';

const router = Router({ mergeParams: true });

router.post('/', requireAuth, validateBody(createPositionSchema), createPosition);
router.get('/', requireAuth, getPositions);
router.put('/:positionId', requireAuth, validateBody(updatePositionSchema), updatePosition);
router.delete('/:positionId', requireAuth, deletePosition);

export default router;
