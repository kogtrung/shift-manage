import type { RequestHandler } from 'express';
import { apiOk } from '../common/apiResponse';
import { availabilityService } from '../services/availabilityService';

export const getAvailability: RequestHandler = async (req, res, next) => {
  try {
    const data = await availabilityService.getMyAvailability(req.authUser!.username);
    res.json(apiOk('Lấy lịch rảnh thành công', data));
  } catch (e) {
    next(e);
  }
};

export const putAvailability: RequestHandler = async (req, res, next) => {
  try {
    const data = await availabilityService.replaceMyAvailability(req.authUser!.username, req.body);
    res.json(apiOk('Cập nhật lịch rảnh thành công', data));
  } catch (e) {
    next(e);
  }
};
