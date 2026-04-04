import type { RequestHandler } from 'express';
import { apiCreated, apiOk } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { salaryConfigService } from '../services/salaryConfigService';

function parseGroupId(p: string | string[] | undefined): number {
  const s = Array.isArray(p) ? p[0] : p;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

function parseConfigId(p: string | string[] | undefined): number {
  const s = Array.isArray(p) ? p[0] : p;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

export const listSalaryConfigs: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    if (Number.isNaN(groupId)) throw new AppError(400, 'groupId không hợp lệ');
    const data = await salaryConfigService.listConfigs(req.authUser!.username, groupId);
    res.json(apiOk('Danh sách cấu hình lương', data));
  } catch (e) {
    next(e);
  }
};

export const createSalaryConfig: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    if (Number.isNaN(groupId)) throw new AppError(400, 'groupId không hợp lệ');
    const data = await salaryConfigService.createConfig(req.authUser!.username, groupId, req.body);
    res.status(201).json(apiCreated('Tạo cấu hình lương thành công', data));
  } catch (e) {
    next(e);
  }
};

export const deleteSalaryConfig: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    const configId = parseConfigId(req.params.configId);
    if (Number.isNaN(groupId) || Number.isNaN(configId)) {
      throw new AppError(400, 'id không hợp lệ');
    }
    await salaryConfigService.deleteConfig(req.authUser!.username, groupId, configId);
    res.json(apiOk('Xóa cấu hình lương thành công', null));
  } catch (e) {
    next(e);
  }
};
