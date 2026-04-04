import { z } from 'zod';

export const createPositionSchema = z.object({
  name: z.string().min(1).max(255),
  colorCode: z.string().max(50).optional(),
});

export const updatePositionSchema = createPositionSchema;

const templateReqItem = z.object({
  positionId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1),
});

export const createShiftTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  description: z.string().max(1000).optional(),
  requirements: z.array(templateReqItem).optional(),
});

export const updateShiftTemplateSchema = createShiftTemplateSchema;

export const createShiftSchema = z.object({
  name: z.string().max(255).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  templateId: z.number().int().positive().optional(),
  note: z.string().max(1000).optional(),
});

export const createShiftBulkSchema = z.object({
  shifts: z.array(createShiftSchema).min(1),
});

export const upsertShiftRequirementSchema = z.object({
  positionId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1),
});

export const shiftsListQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
