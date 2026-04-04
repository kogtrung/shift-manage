import { AppError } from '../common/appError';
import { Availability } from '../models/Availability';
import { MemberPosition } from '../models/MemberPosition';
import { Registration } from '../models/Registration';
import { Shift } from '../models/Shift';
import { ShiftChangeRequest } from '../models/ShiftChangeRequest';
import { ShiftRequirement } from '../models/ShiftRequirement';
import { Position } from '../models/Position';
import { User } from '../models/User';
import { getNextSequence } from './sequenceService';
import { assertManager, assertMemberApproved } from './membership';
import { shiftMatchesMemberAvailability } from './shiftService';
import { timeRangesOverlap } from '../utils/time';

async function countApprovedForPosition(shiftId: number, positionId: number): Promise<number> {
  return Registration.countDocuments({ shiftId, positionId, status: 'APPROVED' });
}

async function assertQuotaAvailable(shiftId: number, positionId: number): Promise<void> {
  const req = await ShiftRequirement.findOne({ shiftId, positionId });
  if (!req) {
    throw new AppError(400, 'Vị trí không thuộc nhu cầu của ca đích');
  }
  const n = await countApprovedForPosition(shiftId, positionId);
  if (n >= req.quantity) {
    throw new AppError(409, 'Ca đích đã đủ nhân sự cho vị trí này');
  }
}

async function assertNoOverlappingApprovedShift(
  groupId: number,
  userId: number,
  shift: { id: number; date: string; startTime: string; endTime: string },
  excludeRegistrationId?: number
): Promise<void> {
  const regs = await Registration.find({ userId, status: 'APPROVED' }).lean();
  if (!regs.length) return;
  const shiftIds = regs.map((r) => r.shiftId);
  const shifts = await Shift.find({ groupId, id: { $in: shiftIds } }).lean();
  const byId = new Map(shifts.map((s) => [s.id, s]));
  for (const r of regs) {
    if (excludeRegistrationId != null && r.id === excludeRegistrationId) continue;
    if (r.shiftId === shift.id) continue;
    const other = byId.get(r.shiftId);
    if (!other) continue;
    if (
      other.date === shift.date &&
      timeRangesOverlap(other.startTime, other.endTime, shift.startTime, shift.endTime)
    ) {
      throw new AppError(409, 'Trùng lịch với ca đã được duyệt');
    }
  }
}

async function memberCanWorkPosition(groupId: number, userId: number, positionId: number): Promise<boolean> {
  const n = await MemberPosition.countDocuments({ userId, groupId });
  if (n === 0) return true;
  const link = await MemberPosition.findOne({ userId, groupId, positionId }).lean();
  return link != null;
}

async function toRequestDto(r: {
  id: number;
  groupId: number;
  userId: number;
  fromShiftId: number;
  toShiftId?: number | null;
  reason?: string;
  status: string;
  managerNote?: string;
}) {
  const [u, fromS, toS] = await Promise.all([
    User.findOne({ id: r.userId }).lean(),
    Shift.findOne({ id: r.fromShiftId }).lean(),
    r.toShiftId != null ? Shift.findOne({ id: r.toShiftId }).lean() : Promise.resolve(null),
  ]);
  const fromReg = await Registration.findOne({
    userId: r.userId,
    shiftId: r.fromShiftId,
    status: 'APPROVED',
  }).lean();
  const fromPos = fromReg
    ? await Position.findOne({ id: fromReg.positionId, groupId: r.groupId }).lean()
    : null;
  return {
    id: r.id,
    groupId: r.groupId,
    userId: r.userId,
    username: u?.username ?? '',
    fullName: u?.fullName?.trim() || u?.username || '',
    fromShiftId: r.fromShiftId,
    fromShiftName: fromS?.name ?? null,
    fromShiftDate: fromS?.date ?? null,
    fromShiftStartTime: fromS?.startTime ?? null,
    fromShiftEndTime: fromS?.endTime ?? null,
    fromPositionName: fromPos?.name ?? null,
    toShiftId: r.toShiftId ?? null,
    toShiftName: toS?.name ?? null,
    toShiftDate: toS?.date ?? null,
    toShiftStartTime: toS?.startTime ?? null,
    toShiftEndTime: toS?.endTime ?? null,
    reason: r.reason ?? null,
    status: r.status,
    managerNote: r.managerNote ?? null,
  };
}

export const shiftChangeService = {
  async createRequest(
    username: string,
    groupId: number,
    body: { fromShiftId: number; toShiftId?: number | null; reason?: string | null }
  ) {
    const user = await User.findOne({ username });
    if (!user) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    await assertMemberApproved(groupId, user.id);

    const fromShift = await Shift.findOne({ id: body.fromShiftId, groupId });
    if (!fromShift) {
      throw new AppError(404, 'Không tìm thấy ca nguồn trong nhóm');
    }

    const fromReg = await Registration.findOne({
      userId: user.id,
      shiftId: body.fromShiftId,
      status: 'APPROVED',
    });
    if (!fromReg) {
      throw new AppError(400, 'Bạn không có đăng ký đã duyệt cho ca nguồn');
    }

    const dup = await ShiftChangeRequest.findOne({
      userId: user.id,
      fromShiftId: body.fromShiftId,
      status: 'PENDING',
    }).lean();
    if (dup) {
      throw new AppError(409, 'Đã có yêu cầu đổi ca đang chờ cho ca này');
    }

    let toShiftId: number | null | undefined = body.toShiftId;
    if (toShiftId === undefined) {
      toShiftId = null;
    }
    if (toShiftId != null) {
      if (toShiftId === body.fromShiftId) {
        throw new AppError(400, 'Ca đích phải khác ca nguồn');
      }
      const toShift = await Shift.findOne({ id: toShiftId, groupId });
      if (!toShift) {
        throw new AppError(404, 'Không tìm thấy ca đích trong nhóm');
      }
      if (toShift.status !== 'OPEN') {
        throw new AppError(400, 'Ca đích phải đang mở');
      }
      const reqPos = await ShiftRequirement.findOne({
        shiftId: toShiftId,
        positionId: fromReg.positionId,
      });
      if (!reqPos) {
        throw new AppError(400, 'Ca đích không có nhu cầu cho cùng vị trí với ca hiện tại');
      }
    }

    const id = await getNextSequence('ShiftChangeRequest');
    const reason = body.reason?.trim() || undefined;

    await ShiftChangeRequest.create({
      id,
      groupId,
      userId: user.id,
      fromShiftId: body.fromShiftId,
      toShiftId: toShiftId ?? null,
      reason,
      status: 'PENDING',
    });

    const row = await ShiftChangeRequest.findOne({ id }).lean();
    if (!row) throw new AppError(500, 'Lỗi tạo yêu cầu');
    return toRequestDto(row);
  },

  async listPending(username: string, groupId: number) {
    const u = await User.findOne({ username });
    if (!u) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    await assertManager(groupId, u.id, 'Chỉ Quản lý mới xem yêu cầu đổi ca');

    const rows = await ShiftChangeRequest.find({ groupId, status: 'PENDING' })
      .sort({ id: 1 })
      .lean();
    return Promise.all(rows.map((r) => toRequestDto(r)));
  },

  async approveRequest(username: string, groupId: number, requestId: number) {
    const manager = await User.findOne({ username });
    if (!manager) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    await assertManager(groupId, manager.id, 'Chỉ Quản lý mới duyệt đổi ca');

    const reqRow = await ShiftChangeRequest.findOne({ id: requestId, groupId });
    if (!reqRow) throw new AppError(404, 'Không tìm thấy yêu cầu');
    if (reqRow.status !== 'PENDING') {
      throw new AppError(400, 'Yêu cầu không còn ở trạng thái chờ duyệt');
    }

    const fromReg = await Registration.findOne({
      userId: reqRow.userId,
      shiftId: reqRow.fromShiftId,
      status: 'APPROVED',
    });
    if (!fromReg) {
      throw new AppError(400, 'Đăng ký ca nguồn không còn hợp lệ');
    }

    const fromShift = await Shift.findOne({ id: reqRow.fromShiftId, groupId });
    if (!fromShift) throw new AppError(404, 'Không tìm thấy ca nguồn');

    if (reqRow.toShiftId == null) {
      fromReg.status = 'CANCELLED';
      fromReg.managerNote = 'Đổi ca — chấp nhận xin nghỉ';
      await fromReg.save();
    } else {
      const toShift = await Shift.findOne({ id: reqRow.toShiftId, groupId });
      if (!toShift) throw new AppError(404, 'Không tìm thấy ca đích');
      if (toShift.status !== 'OPEN') {
        throw new AppError(400, 'Ca đích không còn mở');
      }

      await assertQuotaAvailable(toShift.id, fromReg.positionId);
      await assertNoOverlappingApprovedShift(
        groupId,
        reqRow.userId,
        toShift,
        fromReg.id
      );

      const availabilities = await Availability.find({ userId: reqRow.userId }).lean();
      if (!shiftMatchesMemberAvailability(toShift, availabilities)) {
        throw new AppError(400, 'Nhân viên không có lịch rảnh phù hợp ca đích');
      }
      if (!(await memberCanWorkPosition(groupId, reqRow.userId, fromReg.positionId))) {
        throw new AppError(400, 'Nhân viên chưa được gán vị trí này trong nhóm');
      }

      const dup = await Registration.findOne({
        shiftId: toShift.id,
        userId: reqRow.userId,
        status: { $in: ['PENDING', 'APPROVED'] },
      }).lean();
      if (dup) {
        throw new AppError(409, 'Nhân viên đã có đăng ký trên ca đích');
      }

      fromReg.status = 'CANCELLED';
      fromReg.managerNote = 'Đổi ca — chuyển sang ca khác';
      await fromReg.save();

      const newId = await getNextSequence('Registration');
      await Registration.create({
        id: newId,
        shiftId: toShift.id,
        userId: reqRow.userId,
        positionId: fromReg.positionId,
        status: 'APPROVED',
      });
    }

    reqRow.status = 'APPROVED';
    await reqRow.save();

    const after = await ShiftChangeRequest.findOne({ id: requestId }).lean();
    if (!after) throw new AppError(500, 'Lỗi');
    return toRequestDto(after);
  },

  async rejectRequest(username: string, groupId: number, requestId: number, body: { managerNote?: string | null }) {
    const manager = await User.findOne({ username });
    if (!manager) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    await assertManager(groupId, manager.id, 'Chỉ Quản lý mới từ chối đổi ca');

    const reqRow = await ShiftChangeRequest.findOne({ id: requestId, groupId });
    if (!reqRow) throw new AppError(404, 'Không tìm thấy yêu cầu');
    if (reqRow.status !== 'PENDING') {
      throw new AppError(400, 'Yêu cầu không còn ở trạng thái chờ duyệt');
    }

    reqRow.status = 'REJECTED';
    reqRow.managerNote = body.managerNote?.trim() || undefined;
    await reqRow.save();

    const after = await ShiftChangeRequest.findOne({ id: requestId }).lean();
    if (!after) throw new AppError(500, 'Lỗi');
    return toRequestDto(after);
  },
};
