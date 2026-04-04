import type { RequestHandler } from 'express';
import { apiCreated, apiOk } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { shiftChangeService } from '../services/shiftChangeService';

function parseId(p: string | string[] | undefined): number {
  const s = Array.isArray(p) ? p[0] : p;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

export const createShiftChangeRequest: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    if (Number.isNaN(groupId)) throw new AppError(400, 'groupId không hợp lệ');
    const data = await shiftChangeService.createRequest(req.authUser!.username, groupId, req.body);
    res.status(201).json(apiCreated('Gửi yêu cầu đổi ca thành công', data));
  } catch (e) {
    next(e);
  }
};

export const listPendingShiftChanges: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    if (Number.isNaN(groupId)) throw new AppError(400, 'groupId không hợp lệ');
    const data = await shiftChangeService.listPending(req.authUser!.username, groupId);
    res.json(apiOk('Danh sách yêu cầu đổi ca chờ duyệt', data));
  } catch (e) {
    next(e);
  }
};

export const approveShiftChange: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    const requestId = parseId(req.params.requestId);
    if (Number.isNaN(groupId) || Number.isNaN(requestId)) {
      throw new AppError(400, 'id không hợp lệ');
    }
    const data = await shiftChangeService.approveRequest(req.authUser!.username, groupId, requestId);
    res.json(apiOk('Duyệt đổi ca thành công', data));
  } catch (e) {
    next(e);
  }
};

export const rejectShiftChange: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    const requestId = parseId(req.params.requestId);
    if (Number.isNaN(groupId) || Number.isNaN(requestId)) {
      throw new AppError(400, 'id không hợp lệ');
    }
    const data = await shiftChangeService.rejectRequest(
      req.authUser!.username,
      groupId,
      requestId,
      req.body
    );
    res.json(apiOk('Từ chối yêu cầu đổi ca thành công', data));
  } catch (e) {
    next(e);
  }
};
