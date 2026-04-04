import type { RequestHandler } from 'express';
import { apiCreated, apiOk } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { shiftTemplateService } from '../services/shiftTemplateService';

function parseId(p: string | string[] | undefined): number {
  const s = Array.isArray(p) ? p[0] : p;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

export const createTemplate: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'groupId không hợp lệ');
    }
    const data = await shiftTemplateService.createTemplate(req.authUser!.username, groupId, req.body);
    res.status(201).json(apiCreated('Tạo ca mẫu thành công', data));
  } catch (e) {
    next(e);
  }
};

export const getTemplates: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    if (Number.isNaN(groupId)) {
      throw new AppError(400, 'groupId không hợp lệ');
    }
    const data = await shiftTemplateService.getTemplates(req.authUser!.username, groupId);
    res.json(apiOk('Lấy danh sách ca mẫu thành công', data));
  } catch (e) {
    next(e);
  }
};

export const updateTemplate: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    const templateId = parseId(req.params.templateId);
    if (Number.isNaN(groupId) || Number.isNaN(templateId)) {
      throw new AppError(400, 'id không hợp lệ');
    }
    const data = await shiftTemplateService.updateTemplate(
      req.authUser!.username,
      groupId,
      templateId,
      req.body
    );
    res.json(apiOk('Cập nhật ca mẫu thành công', data));
  } catch (e) {
    next(e);
  }
};

export const deleteTemplate: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId);
    const templateId = parseId(req.params.templateId);
    if (Number.isNaN(groupId) || Number.isNaN(templateId)) {
      throw new AppError(400, 'id không hợp lệ');
    }
    await shiftTemplateService.deleteTemplate(req.authUser!.username, groupId, templateId);
    res.json(apiOk('Xóa ca mẫu thành công', null));
  } catch (e) {
    next(e);
  }
};
