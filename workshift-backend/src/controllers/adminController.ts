import type { RequestHandler } from 'express';
import { apiOk } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { adminService } from '../services/adminService';
import { adminAuditService } from '../services/adminAuditService';
import type { z } from 'zod';
import { adminListQuerySchema } from '../validation/adminSchemas';

function parseUserId(p: string | string[] | undefined): number {
  const s = Array.isArray(p) ? p[0] : p;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

function parseGroupId(p: string | string[] | undefined): number {
  return parseUserId(p);
}

export const adminPing: RequestHandler = (_req, res) => {
  res.json(apiOk('pong', 'ADMIN connection successful'));
};

export const listUsers: RequestHandler = async (req, res, next) => {
  try {
    const q = req.validatedQuery as z.infer<typeof adminListQuerySchema>;
    const data = await adminService.listUsers(q.page, q.size, q.search);
    res.json(apiOk('Danh sách người dùng', data));
  } catch (e) {
    next(e);
  }
};

export const toggleUserStatus: RequestHandler = async (req, res, next) => {
  try {
    const targetUserId = parseUserId(req.params.userId);
    if (Number.isNaN(targetUserId)) {
      throw new AppError(400, 'userId không hợp lệ');
    }
    const data = await adminService.toggleUserStatus(req.authUser!.id, targetUserId);
    res.json(apiOk('Cập nhật trạng thái người dùng thành công', data));
  } catch (e) {
    next(e);
  }
};

export const listGroups: RequestHandler = async (req, res, next) => {
  try {
    const q = req.validatedQuery as z.infer<typeof adminListQuerySchema>;
    const data = await adminService.listGroups(q.page, q.size, q.search);
    res.json(apiOk('Danh sách nhóm', data));
  } catch (e) {
    next(e);
  }
};

export const toggleGroupStatus: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'groupId không hợp lệ');
    }
    const data = await adminService.toggleGroupStatus(req.authUser!.id, groupId);
    res.json(apiOk('Cập nhật trạng thái nhóm thành công', data));
  } catch (e) {
    next(e);
  }
};

export const getMetrics: RequestHandler = async (_req, res, next) => {
  try {
    const data = await adminService.getMetrics();
    res.json(apiOk('Chỉ số hệ thống', data));
  } catch (e) {
    next(e);
  }
};

export const listAdminAuditLogs: RequestHandler = async (req, res, next) => {
  try {
    const q = req.validatedQuery as z.infer<typeof adminListQuerySchema>;
    const data = await adminAuditService.listPaginated(q.page, q.size);
    res.json(apiOk('Nhật ký thao tác admin', data));
  } catch (e) {
    next(e);
  }
};
