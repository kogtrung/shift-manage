import type { RequestHandler } from 'express';
import { apiOk } from '../common/apiResponse';
import { AppError } from '../common/appError';
import { activityReportService } from '../services/activityReportService';
import type { z } from 'zod';
import {
  monthlyReportQuerySchema,
  weeklyReportQuerySchema,
} from '../validation/phaseHSchemas';

function parseGroupId(p: string | string[] | undefined): number {
  const s = Array.isArray(p) ? p[0] : p;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return NaN;
  return n;
}

export const getWeeklyReport: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    if (Number.isNaN(groupId)) throw new AppError(400, 'groupId không hợp lệ');
    const q = req.validatedQuery as z.infer<typeof weeklyReportQuerySchema>;
    const data = await activityReportService.getWeeklyReport(
      req.authUser!.username,
      groupId,
      q.year,
      q.week
    );
    res.json(apiOk('Báo cáo hoạt động theo tuần', data));
  } catch (e) {
    next(e);
  }
};

export const getMonthlyReport: RequestHandler = async (req, res, next) => {
  try {
    const groupId = parseGroupId(req.params.groupId);
    if (Number.isNaN(groupId)) throw new AppError(400, 'groupId không hợp lệ');
    const q = req.validatedQuery as z.infer<typeof monthlyReportQuerySchema>;
    const data = await activityReportService.getMonthlyReport(
      req.authUser!.username,
      groupId,
      q.year,
      q.month
    );
    res.json(apiOk('Báo cáo hoạt động theo tháng', data));
  } catch (e) {
    next(e);
  }
};
