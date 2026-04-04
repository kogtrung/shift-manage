import { z } from 'zod';

const xorUserPosition = z
  .object({
    userId: z.coerce.number().int().positive().optional(),
    positionId: z.coerce.number().int().positive().optional(),
    hourlyRate: z.coerce.number().min(0),
    effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine(
    (b) => (b.userId != null && b.positionId == null) || (b.userId == null && b.positionId != null),
    { message: 'Chỉ được gửi userId hoặc positionId (một trong hai)' }
  );

export const createSalaryConfigSchema = xorUserPosition;

export const payrollQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const shiftRecommendationsQuerySchema = z.object({
  positionId: z.coerce.number().int().positive(),
});
