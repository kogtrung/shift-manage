import type { RequestHandler } from 'express';
import { apiOk } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { registrationService } from '../services/registrationService';

function parseId(p: string | string[] | undefined): number {
  const s = Array.isArray(p) ? p[0] : p;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

export const approveRegistration: RequestHandler = async (req, res, next) => {
  try {
    const registrationId = parseId(req.params.registrationId);
    if (Number.isNaN(registrationId)) {
      throw new AppError(400, 'registrationId không hợp lệ');
    }
    const data = await registrationService.approveRegistration(req.authUser!.username, registrationId);
    res.json(apiOk('Duyệt đăng ký thành công', data));
  } catch (e) {
    next(e);
  }
};

export const rejectRegistration: RequestHandler = async (req, res, next) => {
  try {
    const registrationId = parseId(req.params.registrationId);
    if (Number.isNaN(registrationId)) {
      throw new AppError(400, 'registrationId không hợp lệ');
    }
    const data = await registrationService.rejectRegistration(
      req.authUser!.username,
      registrationId,
      req.body
    );
    res.json(apiOk('Từ chối đăng ký thành công', data));
  } catch (e) {
    next(e);
  }
};

export const cancelRegistration: RequestHandler = async (req, res, next) => {
  try {
    const registrationId = parseId(req.params.registrationId);
    if (Number.isNaN(registrationId)) {
      throw new AppError(400, 'registrationId không hợp lệ');
    }
    const data = await registrationService.cancelRegistration(
      req.authUser!.username,
      registrationId,
      req.body
    );
    res.json(apiOk('Hủy đăng ký thành công', data));
  } catch (e) {
    next(e);
  }
};
