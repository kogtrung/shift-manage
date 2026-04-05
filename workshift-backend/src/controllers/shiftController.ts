import type { RequestHandler } from 'express';
import { apiCreated, apiOk } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { shiftService } from '../services/shiftService';
import { recommendationService } from '../services/recommendationService';
import type { z } from 'zod';
import { shiftsListQuerySchema } from '../validation/shiftPhaseSchemas';
import { shiftRecommendationsQuerySchema } from '../validation/phaseGSchemas';

function parseId(p: string | string[] | undefined): number {
  const s = Array.isArray(p) ? p[0] : p;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

export const listShifts: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'groupId không hợp lệ');
    }
    const q = req.validatedQuery as z.infer<typeof shiftsListQuerySchema>;
    const data = await shiftService.getShifts(groupId, req.authUser!.username, q.from, q.to);
    res.json(apiOk('Lấy danh sách ca làm việc thành công', data));
  } catch (e) {
    next(e);
  }
};

export const createShift: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'groupId không hợp lệ');
    }
    const data = await shiftService.createShift(groupId, req.authUser!.username, req.body);
    res.status(201).json(apiCreated('Tạo ca làm việc thành công', data));
  } catch (e) {
    next(e);
  }
};

export const createShiftsBulk: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'groupId không hợp lệ');
    }
    const data = await shiftService.createShiftsBulk(groupId, req.authUser!.username, req.body.shifts);
    res.status(201).json(apiCreated('Tạo ca làm việc hàng loạt thành công', data));
  } catch (e) {
    next(e);
  }
};

export const getAvailableShifts: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'groupId không hợp lệ');
    }
    const data = await shiftService.getAvailableShifts(groupId, req.authUser!.username);
    res.json(apiOk('Danh sách ca phù hợp', data));
  } catch (e) {
    next(e);
  }
};

export const deleteShift: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    const shiftId = parseId(req.params.shiftId);
    if (Number.isNaN(groupId) || Number.isNaN(shiftId)) {
      throw new AppError(400, 'id không hợp lệ');
    }
    await shiftService.deleteShift(groupId, shiftId, req.authUser!.username);
    res.json(apiOk('Xóa ca làm việc thành công', null));
  } catch (e) {
    next(e);
  }
};

export const lockShift: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    const shiftId = parseId(req.params.shiftId);
    if (Number.isNaN(groupId) || Number.isNaN(shiftId)) {
      throw new AppError(400, 'id không hợp lệ');
    }
    const data = await shiftService.lockShift(groupId, shiftId, req.authUser!.username);
    res.json(apiOk('Khóa ca làm việc thành công', data));
  } catch (e) {
    next(e);
  }
};

export const getShiftRecommendations: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    const shiftId = parseId(req.params.shiftId);
    if (Number.isNaN(groupId) || Number.isNaN(shiftId)) {
      throw new AppError(400, 'id không hợp lệ');
    }
    const q = req.validatedQuery as z.infer<typeof shiftRecommendationsQuerySchema>;
    const data = await recommendationService.listRecommendations(
      req.authUser!.username,
      groupId,
      shiftId,
      q.positionId
    );
    res.json(apiOk('Gợi ý nhân viên phù hợp', data));
  } catch (e) {
    next(e);
  }
};
