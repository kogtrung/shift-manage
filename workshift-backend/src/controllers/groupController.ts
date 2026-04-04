import type { RequestHandler } from 'express';
import { apiCreated, apiOk } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { groupService } from '../services/groupService';
import { groupAuditService } from '../services/groupAuditService';
import type { AuditLogsQuery } from '../validation/groupSchemas';

function singleParam(p: string | string[] | undefined): string | undefined {
  if (p === undefined) return undefined;
  return Array.isArray(p) ? p[0] : p;
}

function parseGroupId(param: string | string[] | undefined): number {
  const s = singleParam(param);
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) {
    return NaN;
  }
  return n;
}

export const getMyGroups: RequestHandler = async (req, res, next) => {
  try {
    const username = req.authUser!.username;
    const data = await groupService.getMyGroups(username);
    res.json(apiOk('Lấy danh sách group thành công', data));
  } catch (e) {
    next(e);
  }
};

export const createGroup: RequestHandler = async (req, res, next) => {
  try {
    const username = req.authUser!.username;
    const data = await groupService.createGroup(username, req.body);
    res.status(201).json(apiCreated('Tạo group thành công', data));
  } catch (e) {
    next(e);
  }
};

export const updateGroup: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.id);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'id group không hợp lệ');
    }
    const username = req.authUser!.username;
    const data = await groupService.updateGroup(username, groupId, req.body);
    res.json(apiOk('Cập nhật group thành công', data));
  } catch (e) {
    next(e);
  }
};

export const toggleGroupStatus: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.id);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'id group không hợp lệ');
    }
    const username = req.authUser!.username;
    const data = await groupService.toggleGroupStatus(username, groupId);
    res.json(apiOk('Cập nhật trạng thái group thành công', data));
  } catch (e) {
    next(e);
  }
};

export const deleteGroup: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.id);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'id group không hợp lệ');
    }
    const username = req.authUser!.username;
    await groupService.deleteGroupPermanently(username, groupId);
    res.json(apiOk('Xóa group vĩnh viễn thành công', null));
  } catch (e) {
    next(e);
  }
};

export const joinGroup: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.id);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'id group không hợp lệ');
    }
    const username = req.authUser!.username;
    const data = await groupService.joinGroup(username, groupId);
    res.status(201).json(apiCreated('Gửi yêu cầu tham gia group thành công', data));
  } catch (e) {
    next(e);
  }
};

export const joinGroupByCode: RequestHandler = async (req, res, next) => {
  try {
    const username = req.authUser!.username;
    const data = await groupService.joinGroupByCode(username, req.body.joinCode);
    res.status(201).json(apiCreated('Gửi yêu cầu tham gia group thành công', data));
  } catch (e) {
    next(e);
  }
};

export const getMembers: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.id);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'id group không hợp lệ');
    }
    const username = req.authUser!.username;
    const data = await groupService.getGroupMembers(username, groupId);
    res.json(apiOk('Lấy danh sách thành viên thành công', data));
  } catch (e) {
    next(e);
  }
};

export const leaveGroup: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.id);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'id group không hợp lệ');
    }
    const username = req.authUser!.username;
    await groupService.leaveGroup(username, groupId);
    res.json(apiOk('Rời group thành công', null));
  } catch (e) {
    next(e);
  }
};

export const getPendingMembers: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.id);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'id group không hợp lệ');
    }
    const username = req.authUser!.username;
    const data = await groupService.getPendingMembers(username, groupId);
    res.json(apiOk('Lấy danh sách yêu cầu tham gia thành công', data));
  } catch (e) {
    next(e);
  }
};

export const reviewMember: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.id);
    const memberId = parseGroupId(req.params.memberId);
    if (Number.isNaN(groupId) || Number.isNaN(memberId)) {
      throw new AppError(400, 'id không hợp lệ');
    }
    const username = req.authUser!.username;
    const data = await groupService.reviewMember(username, groupId, memberId, req.body.action);
    res.json(apiOk('Cập nhật trạng thái thành viên thành công', data));
  } catch (e) {
    next(e);
  }
};

export const getAuditLogs: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.id);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'id group không hợp lệ');
    }
    const username = req.authUser!.username;
    const q = req.validatedQuery as AuditLogsQuery;
    const data = await groupAuditService.getAuditLogs(username, groupId, {
      from: q.from,
      to: q.to,
      actionType: q.actionType,
      actorUserId: q.actorUserId,
      entityType: q.entityType,
      entityId: q.entityId,
      page: q.page,
      size: q.size,
    });
    res.json(apiOk('Lấy nhật ký hoạt động group thành công', data));
  } catch (e) {
    next(e);
  }
};

export const getDailyAuditSummary: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.id);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'id group không hợp lệ');
    }
    const username = req.authUser!.username;
    const q = req.validatedQuery as { date: string };
    const data = await groupAuditService.getDailySummary(username, groupId, q.date);
    res.json(apiOk('Lấy tổng hợp hoạt động theo ngày thành công', data));
  } catch (e) {
    next(e);
  }
};

export const getMonthlyAuditSummary: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.id);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'id group không hợp lệ');
    }
    const username = req.authUser!.username;
    const q = req.validatedQuery as { month: number; year: number };
    const data = await groupAuditService.getMonthlySummary(username, groupId, q.month, q.year);
    res.json(apiOk('Lấy tổng hợp hoạt động theo tháng thành công', data));
  } catch (e) {
    next(e);
  }
};
