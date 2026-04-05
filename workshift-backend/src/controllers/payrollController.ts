import type { RequestHandler } from 'express';
import { apiOk } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { payrollService } from '../services/payrollService';
import type { z } from 'zod';
import { payrollQuerySchema } from '../validation/phaseGSchemas';

function parseGroupId(p: string | string[] | undefined): number {
  const s = Array.isArray(p) ? p[0] : p;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

export const getPayroll: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    if (Number.isNaN(groupId)) throw new AppError(400, 'groupId không hợp lệ');
    const q = req.validatedQuery as z.infer<typeof payrollQuerySchema>;
    const data = await payrollService.getPayroll(req.authUser!.username, groupId, q.month, q.year);
    res.json(apiOk('Bảng lương theo tháng', data));
  } catch (e) {
    next(e);
  }
};
