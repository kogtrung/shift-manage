import { Router } from 'express';
import {
  adminPing,
  getMetrics,
  listAdminAuditLogs,
  listGroups,
  listUsers,
  toggleGroupStatus,
  toggleUserStatus,
} from '../controllers/adminController';
import { requireAuth, requireAdmin } from '../middleware/authJwt';
import { validateQuery } from '../middleware/validateQuery';
import { adminListQuerySchema } from '../validation/adminSchemas';

const router = Router();

router.get('/ping', requireAuth, requireAdmin, adminPing);
router.get('/users', requireAuth, requireAdmin, validateQuery(adminListQuerySchema), listUsers);
router.patch(
  '/users/:userId/toggle-status',
  requireAuth,
  requireAdmin,
  toggleUserStatus
);
router.get('/groups', requireAuth, requireAdmin, validateQuery(adminListQuerySchema), listGroups);
router.patch(
  '/groups/:groupId/toggle-status',
  requireAuth,
  requireAdmin,
  toggleGroupStatus
);
router.get('/metrics', requireAuth, requireAdmin, getMetrics);
router.get(
  '/audit-logs',
  requireAuth,
  requireAdmin,
  validateQuery(adminListQuerySchema),
  listAdminAuditLogs
);

export default router;
