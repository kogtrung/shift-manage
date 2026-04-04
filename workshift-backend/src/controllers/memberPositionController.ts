import type { RequestHandler } from 'express';
import { apiOk } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { memberPositionService } from '../services/memberPositionService';

function parseGroupId(p: string | string[] | undefined): number {
  const s = Array.isArray(p) ? p[0] : p;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

export const getMyPositions: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'groupId không hợp lệ');
    }
    const data = await memberPositionService.getMyPositions(req.authUser!.username, groupId);
    res.json(apiOk('Lấy vị trí của bạn trong nhóm thành công', data));
  } catch (e) {
    next(e);
  }
};

export const putMyPositions: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'groupId không hợp lệ');
    }
    const data = await memberPositionService.replaceMyPositions(
      req.authUser!.username,
      groupId,
      req.body.positionIds
    );
    res.json(apiOk('Cập nhật vị trí trong nhóm thành công', data));
  } catch (e) {
    next(e);
  }
};
