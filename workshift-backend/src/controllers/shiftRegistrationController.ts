import type { RequestHandler } from 'express';
import { apiCreated, apiOk } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { registrationService } from '../services/registrationService';

function parseShiftId(p: string | string[] | undefined): number {
  const s = Array.isArray(p) ? p[0] : p;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

export const registerForShift: RequestHandler = async (req, res, next) => {
  try {
    const shiftId = parseShiftId(req.params.shiftId);
    if (Number.isNaN(shiftId)) {
      throw new AppError(400, 'shiftId không hợp lệ');
    }
    const data = await registrationService.registerForShift(req.authUser!.username, shiftId, req.body);
    res.status(201).json(apiCreated('Đăng ký ca thành công', data));
  } catch (e) {
    next(e);
  }
};

export const listPendingRegistrations: RequestHandler = async (req, res, next) => {
  try {
    const shiftId = parseShiftId(req.params.shiftId);
    if (Number.isNaN(shiftId)) {
      throw new AppError(400, 'shiftId không hợp lệ');
    }
    const data = await registrationService.listPendingForShift(req.authUser!.username, shiftId);
    res.json(apiOk('Danh sách đăng ký chờ duyệt', data));
  } catch (e) {
    next(e);
  }
};

export const assignToShift: RequestHandler = async (req, res, next) => {
  try {
    const shiftId = parseShiftId(req.params.shiftId);
    if (Number.isNaN(shiftId)) {
      throw new AppError(400, 'shiftId không hợp lệ');
    }
    const data = await registrationService.assignDirectly(req.authUser!.username, shiftId, req.body);
    res.status(201).json(apiCreated('Gán nhân viên vào ca thành công', data));
  } catch (e) {
    next(e);
  }
};
