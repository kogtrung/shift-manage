import { z } from 'zod';

/** Cho PATCH không body hoặc body rỗng */
export const emptyObjectSchema = z.preprocess(
  (v) => (v == null || typeof v !== 'object' ? {} : v),
  z.object({})
);

export const registerShiftSchema = z.object({
  positionId: z.coerce.number().int().positive(),
  note: z.string().max(1000).nullish(),
});

export const assignShiftSchema = z.object({
  userId: z.coerce.number().int().positive(),
  positionId: z.coerce.number().int().positive(),
});

export const rejectRegistrationSchema = z.object({
  managerNote: z.string().max(1000).nullish(),
});

export const cancelRegistrationSchema = z.object({
  note: z.string().max(1000).nullish(),
});
