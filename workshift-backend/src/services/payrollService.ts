import { AppError } from '../common/appError';
import { Group } from '../models/Group';
import { Registration } from '../models/Registration';
import { Shift } from '../models/Shift';
import { User } from '../models/User';
import { assertManager } from './membership';
import { resolveHourlyRate } from './salaryConfigService';
import { shiftDurationHours } from '../utils/time';
import { vnMonthIsoRangeContaining } from '../utils/vnTime';

type Line = {
  shiftId: number;
  date: string;
  positionId: number;
  hours: number;
  hourlyRate: number;
  pay: number;
};

export const payrollService = {
  async getPayroll(username: string, groupId: number, month: number, year: number) {
    const user = await User.findOne({ username });
    if (!user) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    const g = await Group.findOne({ id: groupId });
    if (!g) throw new AppError(404, 'Không tìm thấy nhóm');
    await assertManager(groupId, user.id, 'Chỉ Quản lý mới xem bảng lương');

    const padMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const { from, to } = vnMonthIsoRangeContaining(padMonth);

    const shifts = await Shift.find({ groupId, date: { $gte: from, $lte: to } }).lean();
    if (!shifts.length) {
      return {
        groupId,
        month,
        year,
        from,
        to,
        items: [] as Array<{
          userId: number;
          username: string;
          fullName: string;
          totalHours: number;
          estimatedPay: number;
          shiftsWorked: number;
          lines: Line[];
        }>,
      };
    }

    const shiftMap = new Map(shifts.map((s) => [s.id, s]));
    const shiftIds = shifts.map((s) => s.id);

    const regs = await Registration.find({
      shiftId: { $in: shiftIds },
      status: 'APPROVED',
    }).lean();

    const byUser = new Map<number, { lines: Line[] }>();
    for (const r of regs) {
      const shift = shiftMap.get(r.shiftId);
      if (!shift) continue;
      const hours = shiftDurationHours(shift.startTime, shift.endTime);
      const rate = await resolveHourlyRate(groupId, r.userId, r.positionId, shift.date);
      const pay = Math.round(hours * rate * 100) / 100;
      const line: Line = {
        shiftId: shift.id,
        date: shift.date,
        positionId: r.positionId,
        hours,
        hourlyRate: rate,
        pay,
      };
      if (!byUser.has(r.userId)) {
        byUser.set(r.userId, { lines: [] });
      }
      byUser.get(r.userId)!.lines.push(line);
    }

    const userIds = [...byUser.keys()];
    const users = await User.find({ id: { $in: userIds } }).lean();
    const umap = new Map(users.map((u) => [u.id, u]));

    const items = userIds.map((uid) => {
      const u = umap.get(uid);
      const lines = byUser.get(uid)!.lines;
      const totalHours = Math.round(lines.reduce((s, l) => s + l.hours, 0) * 100) / 100;
      const estimatedPay = Math.round(lines.reduce((s, l) => s + l.pay, 0) * 100) / 100;
      const fullName = u?.fullName?.trim() || u?.username || '';
      return {
        userId: uid,
        username: u?.username ?? '',
        fullName,
        shiftsWorked: lines.length,
        totalHours,
        estimatedPay,
        lines,
      };
    });

    items.sort((a, b) => a.username.localeCompare(b.username));

    return {
      groupId,
      month,
      year,
      from,
      to,
      items,
    };
  },
};
