import { AppError } from '../common/appError';
import { Group } from '../models/Group';
import { Position } from '../models/Position';
import { Registration } from '../models/Registration';
import { Shift } from '../models/Shift';
import { User } from '../models/User';
import {
  vnMondayToSundayRangeContaining,
  vnMonthIsoRangeContaining,
  vnTodayIsoDate,
} from '../utils/vnTime';

type CalendarQuery = {
  from?: string;
  to?: string;
  range?: 'week' | 'month';
};

function resolveRange(q: CalendarQuery): { from: string; to: string; mode: 'custom' | 'week' | 'month' } {
  if ((q.from != null) !== (q.to != null)) {
    throw new AppError(400, 'Cần truyền cả from và to (YYYY-MM-DD)');
  }
  if (q.from != null && q.to != null) {
    if (q.from > q.to) {
      throw new AppError(400, 'from phải nhỏ hơn hoặc bằng to');
    }
    return { from: q.from, to: q.to, mode: 'custom' };
  }
  if (q.range === 'month') {
    const today = vnTodayIsoDate();
    const { from, to } = vnMonthIsoRangeContaining(today);
    return { from, to, mode: 'month' };
  }
  const today = vnTodayIsoDate();
  if (q.range === 'week') {
    const { from, to } = vnMondayToSundayRangeContaining(today);
    return { from, to, mode: 'week' };
  }
  const { from, to } = vnMondayToSundayRangeContaining(today);
  return { from, to, mode: 'week' };
}

export const meCalendarService = {
  async getMyCalendar(username: string, query: CalendarQuery) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }

    const { from, to, mode } = resolveRange(query);

    const regs = await Registration.find({ userId: user.id, status: 'APPROVED' }).lean();
    if (!regs.length) {
      return {
        from,
        to,
        range: mode,
        items: [] as Array<Record<string, unknown>>,
      };
    }

    const shiftIds = [...new Set(regs.map((r) => r.shiftId))];
    const shifts = await Shift.find({
      id: { $in: shiftIds },
      date: { $gte: from, $lte: to },
    }).lean();
    const shiftMap = new Map(shifts.map((s) => [s.id, s]));

    const groupIds = [...new Set(shifts.map((s) => s.groupId))];
    const groups = await Group.find({ id: { $in: groupIds } }).lean();
    const groupMap = new Map(groups.map((g) => [g.id, g]));

    const posIds = [...new Set(regs.map((r) => r.positionId))];
    const positions = await Position.find({ id: { $in: posIds } }).lean();
    const posMap = new Map(positions.map((p) => [p.id, p]));

    const items = [];
    for (const r of regs) {
      const shift = shiftMap.get(r.shiftId);
      if (!shift) continue;
      const g = groupMap.get(shift.groupId);
      const p = posMap.get(r.positionId);
      items.push({
        registrationId: r.id,
        shiftId: shift.id,
        groupId: shift.groupId,
        groupName: g?.name ?? '',
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        positionId: r.positionId,
        positionName: p?.name ?? '',
        positionColorCode: p?.colorCode ?? null,
        status: r.status,
      });
    }

    items.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    return {
      from,
      to,
      range: mode,
      items,
    };
  },
};
