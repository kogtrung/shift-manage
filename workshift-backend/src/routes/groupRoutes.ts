import { Router } from 'express';
import {
  createGroup,
  deleteGroup,
  getAuditLogs,
  getDailyAuditSummary,
  getMembers,
  getMonthlyAuditSummary,
  getMyGroups,
  getPendingMembers,
  joinGroup,
  joinGroupByCode,
  leaveGroup,
  reviewMember,
  toggleGroupStatus,
  updateGroup,
} from '../controllers/groupController';
import { requireAuth } from '../middleware/authJwt';
import { validateBody } from '../middleware/validateBody';
import { validateQuery } from '../middleware/validateQuery';
import {
  auditLogsQuerySchema,
  createGroupSchema,
  dailySummaryQuerySchema,
  joinByCodeSchema,
  monthlySummaryQuerySchema,
  reviewMemberSchema,
  updateGroupSchema,
} from '../validation/groupSchemas';

const router = Router();

router.get('/my-groups', requireAuth, getMyGroups);
router.post('/join-by-code', requireAuth, validateBody(joinByCodeSchema), joinGroupByCode);
router.post('/', requireAuth, validateBody(createGroupSchema), createGroup);
router.put('/:id', requireAuth, validateBody(updateGroupSchema), updateGroup);
router.patch('/:id/status', requireAuth, toggleGroupStatus);
router.delete('/:id', requireAuth, deleteGroup);
router.post('/:id/join', requireAuth, joinGroup);
router.get('/:id/members/pending', requireAuth, getPendingMembers);
router.get('/:id/members', requireAuth, getMembers);
router.delete('/:id/leave', requireAuth, leaveGroup);
router.patch('/:id/members/:memberId', requireAuth, validateBody(reviewMemberSchema), reviewMember);
router.get(
  '/:id/audit-logs/summary/daily',
  requireAuth,
  validateQuery(dailySummaryQuerySchema),
  getDailyAuditSummary
);
router.get(
  '/:id/audit-logs/summary/monthly',
  requireAuth,
  validateQuery(monthlySummaryQuerySchema),
  getMonthlyAuditSummary
);
router.get('/:id/audit-logs', requireAuth, validateQuery(auditLogsQuerySchema), getAuditLogs);

export default router;
