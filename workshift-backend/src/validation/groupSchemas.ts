import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Tên group không được để trống').max(255, 'Tên group tối đa 255 ký tự'),
  description: z.string().max(1000, 'Mô tả tối đa 1000 ký tự').nullish(),
});

export const updateGroupSchema = createGroupSchema;

export const joinByCodeSchema = z.object({
  joinCode: z
    .string()
    .min(1, 'Mã tham gia không được để trống')
    .length(6, 'Mã tham gia phải đúng 6 ký tự')
    .regex(/^[A-Za-z0-9]{6}$/, 'Mã tham gia chỉ gồm chữ và số'),
});

export const reviewMemberSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT'], { message: 'Action không được để trống' }),
});

const actionTypeEnum = z.enum([
  'GROUP_CREATED',
  'GROUP_UPDATED',
  'GROUP_CLOSED',
  'GROUP_REOPENED',
  'GROUP_DELETE',
  'GROUP_DELETED',
  'GROUP_MEMBER_JOIN_REQUESTED',
  'GROUP_MEMBER_APPROVED',
  'GROUP_MEMBER_REJECTED',
  'REGISTRATION_CREATED',
  'REGISTRATION_APPROVED',
  'REGISTRATION_REJECTED',
  'REGISTRATION_CANCELLED',
]);

const entityTypeEnum = z.enum(['GROUP', 'GROUP_MEMBER', 'REGISTRATION']);

export const auditLogsQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  actionType: actionTypeEnum.optional(),
  actorUserId: z.coerce.number().int().positive().optional(),
  entityType: entityTypeEnum.optional(),
  entityId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  size: z.coerce.number().int().min(1).max(200).optional().default(20),
});

export const dailySummaryQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const monthlySummaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type JoinByCodeInput = z.infer<typeof joinByCodeSchema>;
export type ReviewMemberInput = z.infer<typeof reviewMemberSchema>;
export type AuditLogsQuery = z.infer<typeof auditLogsQuerySchema>;
