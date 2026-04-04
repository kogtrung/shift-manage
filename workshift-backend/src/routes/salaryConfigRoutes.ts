import { Router } from 'express';
import {
  createSalaryConfig,
  deleteSalaryConfig,
  listSalaryConfigs,
} from '../controllers/salaryConfigController';
import { requireAuth } from '../middleware/authJwt';
import { validateBody } from '../middleware/validateBody';
import { createSalaryConfigSchema } from '../validation/phaseGSchemas';

const router = Router({ mergeParams: true });

router.post('/', requireAuth, validateBody(createSalaryConfigSchema), createSalaryConfig);
router.get('/', requireAuth, listSalaryConfigs);
router.delete('/:configId', requireAuth, deleteSalaryConfig);

export default router;
