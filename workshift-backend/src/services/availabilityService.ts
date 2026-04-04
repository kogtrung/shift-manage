import { AppError } from '../common/appError';
import { Availability } from '../models/Availability';
import { User } from '../models/User';
import { getNextSequence } from './sequenceService';
import { normalizeTimeString, timeToSeconds } from '../utils/time';

function toDto(a: { id: number; dayOfWeek: number; startTime: string; endTime: string }) {
  return {
    id: a.id,
    dayOfWeek: a.dayOfWeek,
    startTime: a.startTime,
    endTime: a.endTime,
  };
}

export const availabilityService = {
  async getMyAvailability(username: string) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    const rows = await Availability.find({ userId: user.id }).sort({ dayOfWeek: 1, startTime: 1 }).lean();
    return rows.map((r) => toDto(r));
  },

  async replaceMyAvailability(
    username: string,
    body: { slots: Array<{ dayOfWeek: number; startTime: string; endTime: string }> }
  ) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }

    for (const s of body.slots) {
      let st: string;
      let et: string;
      try {
        st = normalizeTimeString(s.startTime);
        et = normalizeTimeString(s.endTime);
      } catch {
        throw new AppError(400, 'Định dạng giờ không hợp lệ');
      }
      if (timeToSeconds(st) >= timeToSeconds(et)) {
        throw new AppError(400, 'Giờ bắt đầu phải trước giờ kết thúc');
      }
    }

    await Availability.deleteMany({ userId: user.id });

    for (const s of body.slots) {
      const st = normalizeTimeString(s.startTime);
      const et = normalizeTimeString(s.endTime);
      const id = await getNextSequence('Availability');
      await Availability.create({
        id,
        userId: user.id,
        dayOfWeek: s.dayOfWeek,
        startTime: st,
        endTime: et,
      });
    }

    const rows = await Availability.find({ userId: user.id }).sort({ dayOfWeek: 1, startTime: 1 }).lean();
    return rows.map((r) => toDto(r));
  },
};
