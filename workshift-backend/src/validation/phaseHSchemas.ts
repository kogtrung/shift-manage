import { z } from 'zod';

export const createShiftChangeRequestSchema = z.object({
  fromShiftId: z.coerce.number().int().positive(),
  toShiftId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  reason: z.string().max(1000).nullish(),
});

export const rejectShiftChangeSchema = z.object({
  managerNote: z.string().max(1000).nullish(),
});

export const emptyObjectSchemaH = z.preprocess(
  (v) => (v == null || typeof v !== 'object' ? {} : v),
  z.object({})
);

export const weeklyReportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  week: z.coerce.number().int().min(1).max(53),
});

export const monthlyReportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});
