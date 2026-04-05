import type { RequestHandler } from 'express';
import { apiOk } from '../common/apiResponse';
import { meCalendarService } from '../services/meCalendarService';
import type { z } from 'zod';
import { meCalendarQuerySchema } from '../validation/phaseESchemas';

export const getMyCalendar: RequestHandler = async (req, res, next) => {
  try {
    const q = req.validatedQuery as z.infer<typeof meCalendarQuerySchema>;
    const data = await meCalendarService.getMyCalendar(req.authUser!.username, q);
    res.json(apiOk('Lấy lịch cá nhân thành công', data));
  } catch (e) {
    next(e);
  }
};
