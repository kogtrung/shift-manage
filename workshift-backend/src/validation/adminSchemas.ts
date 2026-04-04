import { z } from 'zod';

export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  size: z.coerce.number().int().min(1).max(200).optional().default(20),
  search: z.string().max(200).optional(),
});
