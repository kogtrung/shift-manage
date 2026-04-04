import { Router } from 'express';
import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  updateTemplate,
} from '../controllers/shiftTemplateController';
import { requireAuth } from '../middleware/authJwt';
import { validateBody } from '../middleware/validateBody';
import { createShiftTemplateSchema, updateShiftTemplateSchema } from '../validation/shiftPhaseSchemas';

const router = Router({ mergeParams: true });

router.post('/', requireAuth, validateBody(createShiftTemplateSchema), createTemplate);
router.get('/', requireAuth, getTemplates);
router.put('/:templateId', requireAuth, validateBody(updateShiftTemplateSchema), updateTemplate);
router.delete('/:templateId', requireAuth, deleteTemplate);

export default router;
