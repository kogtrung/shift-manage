import { AppError } from '../common/appError';
import { Availability } from '../models/Availability';
import { GroupMember } from '../models/GroupMember';
import { MemberPosition } from '../models/MemberPosition';
import { Position } from '../models/Position';
import { Registration } from '../models/Registration';
import { Shift } from '../models/Shift';
import { ShiftRequirement } from '../models/ShiftRequirement';
import { User } from '../models/User';
import { assertManager } from './membership';
import { shiftMatchesMemberAvailability } from './shiftService';
import { timeRangesOverlap } from '../utils/time';

async function hasApprovedOverlapInGroup(
  groupId: number,
  userId: number,
  shift: { id: number; date: string; startTime: string; endTime: string }
): Promise<boolean> {
  const regs = await Registration.find({ userId, status: 'APPROVED' }).lean();
  if (!regs.length) return false;
  const shiftIds = regs.map((r) => r.shiftId);
  const shifts = await Shift.find({ groupId, id: { $in: shiftIds } }).lean();
  for (const other of shifts) {
    if (other.id === shift.id) continue;
    if (
      other.date === shift.date &&
      timeRangesOverlap(other.startTime, other.endTime, shift.startTime, shift.endTime)
    ) {
      return true;
    }
  }
  return false;
}

async function memberCanWorkPosition(
  groupId: number,
  userId: number,
  positionId: number
): Promise<boolean> {
  const n = await MemberPosition.countDocuments({ userId, groupId });
  if (n === 0) return true;
  const link = await MemberPosition.findOne({ userId, groupId, positionId }).lean();
  return link != null;
}

export const recommendationService = {
  async listRecommendations(
    username: string,
    groupId: number,
    shiftId: number,
    positionId: number
  ) {
    const manager = await User.findOne({ username });
    if (!manager) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    await assertManager(groupId, manager.id, 'Chỉ Quản lý mới xem gợi ý nhân viên');

    const shift = await Shift.findOne({ id: shiftId, groupId });
    if (!shift) throw new AppError(404, 'Không tìm thấy ca làm việc');

    const reqRow = await ShiftRequirement.findOne({ shiftId, positionId });
    if (!reqRow) {
      throw new AppError(400, 'Vị trí không thuộc nhu cầu của ca này');
    }

    const position = await Position.findOne({ id: positionId, groupId }).lean();
    if (!position) throw new AppError(404, 'Không tìm thấy vị trí');

    const members = await GroupMember.find({ groupId, status: 'APPROVED' }).lean();
    const userIds = members.map((m) => m.userId);

    const out: Array<{
      userId: number;
      username: string;
      fullName: string;
    }> = [];

    for (const uid of userIds) {
      const avail = await Availability.find({ userId: uid }).lean();
      if (!shiftMatchesMemberAvailability(shift, avail)) continue;
      if (await hasApprovedOverlapInGroup(groupId, uid, shift)) continue;
      if (!(await memberCanWorkPosition(groupId, uid, positionId))) continue;

      const pendingOrApproved = await Registration.findOne({
        shiftId,
        userId: uid,
        status: { $in: ['PENDING', 'APPROVED'] },
      }).lean();
      if (pendingOrApproved) continue;

      const u = await User.findOne({ id: uid }).lean();
      if (!u) continue;
      out.push({
        userId: uid,
        username: u.username,
        fullName: u.fullName?.trim() || u.username,
      });
    }

    out.sort((a, b) => a.username.localeCompare(b.username));
    return out;
  },
};
