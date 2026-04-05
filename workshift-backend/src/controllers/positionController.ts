import type { RequestHandler } from 'express';
import { apiCreated, apiOk } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { positionService } from '../services/positionService';

function parseId(p: string | string[] | undefined): number {
  const s = Array.isArray(p) ? p[0] : p;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

export const createPosition: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'groupId không hợp lệ');
    }
    const data = await positionService.createPosition(req.authUser!.username, groupId, req.body);
    res.status(201).json(apiCreated('Tạo vị trí thành công', data));
  } catch (e) {
    next(e);
  }
};

export const getPositions: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'groupId không hợp lệ');
    }
    const data = await positionService.getPositions(req.authUser!.username, groupId);
    res.json(apiOk('Lấy danh sách vị trí thành công', data));
  } catch (e) {
    next(e);
  }
};

export const updatePosition: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    const positionId = parseId(req.params.positionId);
    if (Number.isNaN(groupId) || Number.isNaN(positionId)) {
      throw new AppError(400, 'id không hợp lệ');
    }
    const data = await positionService.updatePosition(
      req.authUser!.username,
      groupId,
      positionId,
      req.body
    );
    res.json(apiOk('Cập nhật vị trí thành công', data));
  } catch (e) {
    next(e);
  }
};

export const deletePosition: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    const positionId = parseId(req.params.positionId);
    if (Number.isNaN(groupId) || Number.isNaN(positionId)) {
      throw new AppError(400, 'id không hợp lệ');
    }
    await positionService.deletePosition(req.authUser!.username, groupId, positionId);
    res.json(apiOk('Xóa vị trí thành công', null));
  } catch (e) {
    next(e);
  }
};
