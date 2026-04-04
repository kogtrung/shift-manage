import { AppError } from '../common/appError';
import { Group } from '../models/Group';
import { Registration } from '../models/Registration';
import { Shift } from '../models/Shift';
import { User } from '../models/User';
import { assertManager } from './membership';
import { shiftDurationHours } from '../utils/time';
import { isoWeekDateRange } from '../utils/isoWeek';
import { vnMonthIsoRangeContaining } from '../utils/vnTime';

export const activityReportService = {
  async getWeeklyReport(username: string, groupId: number, year: number, week: number) {
    const user = await User.findOne({ username });
    if (!user) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    const g = await Group.findOne({ id: groupId });
    if (!g) throw new AppError(404, 'Không tìm thấy nhóm');
    await assertManager(groupId, user.id, 'Chỉ Quản lý mới xem báo cáo');

    const { from, to } = isoWeekDateRange(year, week);

    const shifts = await Shift.find({
      groupId,
      date: { $gte: from, $lte: to },
    }).lean();
    if (!shifts.length) {
      return { groupId, year, week, from, to, totalShiftInstances: 0, totalHours: 0, byUser: [] };
    }

    const shiftMap = new Map(shifts.map((s) => [s.id, s]));
    const shiftIds = shifts.map((s) => s.id);

    const regs = await Registration.find({
      shiftId: { $in: shiftIds },
      status: 'APPROVED',
    }).lean();

    const hoursByUser = new Map<number, { hours: number; shifts: number }>();
    let totalHours = 0;

    for (const r of regs) {
      const s = shiftMap.get(r.shiftId);
      if (!s) continue;
      const h = shiftDurationHours(s.startTime, s.endTime);
      totalHours += h;
      const cur = hoursByUser.get(r.userId) ?? { hours: 0, shifts: 0 };
      cur.hours += h;
      cur.shifts += 1;
      hoursByUser.set(r.userId, cur);
    }

    const userIds = [...hoursByUser.keys()];
    const users = await User.find({ id: { $in: userIds } }).lean();
    const umap = new Map(users.map((u) => [u.id, u]));

    const byUser = userIds.map((uid) => {
      const agg = hoursByUser.get(uid)!;
      const u = umap.get(uid);
      return {
        userId: uid,
        username: u?.username ?? '',
        fullName: u?.fullName?.trim() || u?.username || '',
        shiftsWorked: agg.shifts,
        totalHours: Math.round(agg.hours * 100) / 100,
      };
    });
    byUser.sort((a, b) => a.username.localeCompare(b.username));

    return {
      groupId,
      year,
      week,
      from,
      to,
      totalShiftInstances: shifts.length,
      totalHours: Math.round(totalHours * 100) / 100,
      byUser,
    };
  },

  async getMonthlyReport(username: string, groupId: number, year: number, month: number) {
    const user = await User.findOne({ username });
    if (!user) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    const g = await Group.findOne({ id: groupId });
    if (!g) throw new AppError(404, 'Không tìm thấy nhóm');
    await assertManager(groupId, user.id, 'Chỉ Quản lý mới xem báo cáo');

    const padMonth = `${year}-${String(month).padStart(2, '0')}-15`;
    const { from, to } = vnMonthIsoRangeContaining(padMonth);

    const shifts = await Shift.find({
      groupId,
      date: { $gte: from, $lte: to },
    }).lean();
    if (!shifts.length) {
      return {
        groupId,
        year,
        month,
        from,
        to,
        totalShiftInstances: 0,
        totalHours: 0,
        byUser: [] as Array<{
          userId: number;
          username: string;
          fullName: string;
          shiftsWorked: number;
          totalHours: number;
        }>,
      };
    }

    const shiftMap = new Map(shifts.map((s) => [s.id, s]));
    const shiftIds = shifts.map((s) => s.id);

    const regs = await Registration.find({
      shiftId: { $in: shiftIds },
      status: 'APPROVED',
    }).lean();

    const hoursByUser = new Map<number, { hours: number; shifts: number }>();
    let totalHours = 0;

    for (const r of regs) {
      const s = shiftMap.get(r.shiftId);
      if (!s) continue;
      const h = shiftDurationHours(s.startTime, s.endTime);
      totalHours += h;
      const cur = hoursByUser.get(r.userId) ?? { hours: 0, shifts: 0 };
      cur.hours += h;
      cur.shifts += 1;
      hoursByUser.set(r.userId, cur);
    }

    const userIds = [...hoursByUser.keys()];
    const users = await User.find({ id: { $in: userIds } }).lean();
    const umap = new Map(users.map((u) => [u.id, u]));

    const byUser = userIds.map((uid) => {
      const agg = hoursByUser.get(uid)!;
      const u = umap.get(uid);
      return {
        userId: uid,
        username: u?.username ?? '',
        fullName: u?.fullName?.trim() || u?.username || '',
        shiftsWorked: agg.shifts,
        totalHours: Math.round(agg.hours * 100) / 100,
      };
    });
    byUser.sort((a, b) => a.username.localeCompare(b.username));

    return {
      groupId,
      year,
      month,
      from,
      to,
      totalShiftInstances: shifts.length,
      totalHours: Math.round(totalHours * 100) / 100,
      byUser,
    };
  },
};
