import type { RequestHandler } from 'express';
import { apiCreated, apiOk } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { shiftRequirementService } from '../services/shiftRequirementService';

function parseId(p: string | string[] | undefined): number {
  const s = Array.isArray(p) ? p[0] : p;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

export const createRequirement: RequestHandler = async (req, res, next) => {
  try {
    const shiftId = parseId(req.params.shiftId);
    if (Number.isNaN(shiftId)) {
      throw new AppError(400, 'shiftId không hợp lệ');
    }
    const data = await shiftRequirementService.createRequirement(
      req.authUser!.username,
      shiftId,
      req.body
    );
    res.status(201).json(apiCreated('Tạo cấu hình nhu cầu thành công', data));
  } catch (e) {
    next(e);
  }
};

export const listRequirements: RequestHandler = async (req, res, next) => {
  try {
    const shiftId = parseId(req.params.shiftId);
    if (Number.isNaN(shiftId)) {
      throw new AppError(400, 'shiftId không hợp lệ');
    }
    const data = await shiftRequirementService.getRequirements(req.authUser!.username, shiftId);
    res.json(apiOk('Lấy cấu hình nhu cầu thành công', data));
  } catch (e) {
    next(e);
  }
};

export const updateRequirement: RequestHandler = async (req, res, next) => {
  try {
    const shiftId = parseId(req.params.shiftId);
    const requirementId = parseId(req.params.requirementId);
    if (Number.isNaN(shiftId) || Number.isNaN(requirementId)) {
      throw new AppError(400, 'id không hợp lệ');
    }
    const data = await shiftRequirementService.updateRequirement(
      req.authUser!.username,
      shiftId,
      requirementId,
      req.body
    );
    res.json(apiOk('Cập nhật cấu hình nhu cầu thành công', data));
  } catch (e) {
    next(e);
  }
};

export const deleteRequirement: RequestHandler = async (req, res, next) => {
  try {
    const shiftId = parseId(req.params.shiftId);
    const requirementId = parseId(req.params.requirementId);
    if (Number.isNaN(shiftId) || Number.isNaN(requirementId)) {
      throw new AppError(400, 'id không hợp lệ');
    }
    await shiftRequirementService.deleteRequirement(
      req.authUser!.username,
      shiftId,
      requirementId
    );
    res.json(apiOk('Xóa cấu hình nhu cầu thành công', null));
  } catch (e) {
    next(e);
  }
};
