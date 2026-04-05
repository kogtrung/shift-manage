import { AppError } from '../common/appError';
import { Group } from '../models/Group';
import { Position } from '../models/Position';
import { Registration } from '../models/Registration';
import { Shift } from '../models/Shift';
import { ShiftRequirement } from '../models/ShiftRequirement';
import { User } from '../models/User';
import { assertManager } from './membership';
import { vnTodayIsoDate } from '../utils/vnTime';

export const understaffedAlertService = {
  async listUnderstaffed(username: string, groupId: number) {
    const user = await User.findOne({ username });
    if (!user) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    const g = await Group.findOne({ id: groupId });
    if (!g) throw new AppError(404, 'Không tìm thấy nhóm');
    await assertManager(groupId, user.id, 'Chỉ Quản lý mới xem cảnh báo');

    const today = vnTodayIsoDate();
    const openShifts = await Shift.find({
      groupId,
      status: 'OPEN',
      date: { $gte: today },
    })
      .sort({ date: 1, startTime: 1 })
      .lean();

    const alerts: Array<{
      shiftId: number;
      date: string;
      startTime: string;
      endTime: string;
      positionId: number;
      positionName: string;
      required: number;
      approved: number;
      missing: number;
    }> = [];

    for (const shift of openShifts) {
      const reqs = await ShiftRequirement.find({ shiftId: shift.id }).lean();
      if (!reqs.length) continue;
      const posIds = reqs.map((r) => r.positionId);
      const positions = await Position.find({ id: { $in: posIds } }).lean();
      const pmap = new Map(positions.map((p) => [p.id, p]));

      for (const req of reqs) {
        const approved = await Registration.countDocuments({
          shiftId: shift.id,
          positionId: req.positionId,
          status: 'APPROVED',
        });
        const missing = req.quantity - approved;
        if (missing > 0) {
          const p = pmap.get(req.positionId);
          alerts.push({
            shiftId: shift.id,
            date: shift.date,
            startTime: shift.startTime,
            endTime: shift.endTime,
            positionId: req.positionId,
            positionName: p?.name ?? '',
            required: req.quantity,
            approved,
            missing,
          });
        }
      }
    }

    return alerts;
  },
};
