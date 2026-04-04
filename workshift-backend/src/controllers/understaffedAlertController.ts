import type { RequestHandler } from 'express';
import { apiOk } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { understaffedAlertService } from '../services/understaffedAlertService';

function parseGroupId(p: string | string[] | undefined): number {
  const s = Array.isArray(p) ? p[0] : p;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

export const getUnderstaffedAlerts: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    if (Number.isNaN(groupId)) throw new AppError(400, 'groupId không hợp lệ');
    const data = await understaffedAlertService.listUnderstaffed(req.authUser!.username, groupId);
    res.json(apiOk('Cảnh báo thiếu nhân sự', data));
  } catch (e) {
    next(e);
  }
};
