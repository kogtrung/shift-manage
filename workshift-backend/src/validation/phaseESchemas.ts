import { z } from 'zod';

const slotSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

export const putAvailabilitySchema = z.object({
  slots: z.array(slotSchema),
});

export const meCalendarQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  range: z.enum(['week', 'month']).optional(),
});

export const putMyPositionsSchema = z.object({
  positionIds: z.array(z.coerce.number().int().positive()),
});
