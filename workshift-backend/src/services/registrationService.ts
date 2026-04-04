import { AppError } from '../common/appError';
import { Availability } from '../models/Availability';
import { GroupMember } from '../models/GroupMember';
import { MemberPosition } from '../models/MemberPosition';
import { Position } from '../models/Position';
import { Registration } from '../models/Registration';
import { Shift } from '../models/Shift';
import { ShiftRequirement } from '../models/ShiftRequirement';
import { User } from '../models/User';
import { groupAuditService } from './groupAuditService';
import { getNextSequence } from './sequenceService';
import { assertManager, assertMemberApproved } from './membership';
import { shiftMatchesMemberAvailability } from './shiftService';
import { timeRangesOverlap } from '../utils/time';

function shiftStartDate(shift: { date: string; startTime: string }): Date {
  const [y, mo, d] = shift.date.split('-').map(Number);
  const parts = shift.startTime.split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const s = parts[2] ?? 0;
  return new Date(y, mo - 1, d, h, m, s);
}

async function toDto(reg: {
  id: number;
  shiftId: number;
  userId: number;
  positionId: number;
  status: string;
  note?: string;
  managerNote?: string;
}) {
  const [user, pos] = await Promise.all([
    User.findOne({ id: reg.userId }).lean(),
    Position.findOne({ id: reg.positionId }).lean(),
  ]);
  return {
    id: reg.id,
    shiftId: reg.shiftId,
    userId: reg.userId,
    username: user?.username ?? '',
    fullName: user?.fullName?.trim() || user?.username || '',
    positionId: reg.positionId,
    positionName: pos?.name ?? '',
    positionColorCode: pos?.colorCode ?? null,
    status: reg.status,
    note: reg.note ?? null,
    managerNote: reg.managerNote ?? null,
  };
}

async function countApprovedForPosition(shiftId: number, positionId: number): Promise<number> {
  return Registration.countDocuments({ shiftId, positionId, status: 'APPROVED' });
}

async function assertQuotaAvailable(shiftId: number, positionId: number): Promise<void> {
  const req = await ShiftRequirement.findOne({ shiftId, positionId });
  if (!req) {
    throw new AppError(400, 'Vị trí không thuộc nhu cầu của ca này');
  }
  const n = await countApprovedForPosition(shiftId, positionId);
  if (n >= req.quantity) {
    throw new AppError(409, 'Đã đủ nhân sự cho vị trí này');
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

export const registrationService = {
  async registerForShift(username: string, shiftId: number, body: { positionId: number; note?: string | null }) {
    const user = await User.findOne({ username });
    if (!user) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');

    const shift = await Shift.findOne({ id: shiftId });
    if (!shift) throw new AppError(404, 'Không tìm thấy ca làm việc');
    if (shift.status !== 'OPEN') {
      throw new AppError(400, 'Chỉ có thể đăng ký ca đang mở');
    }

    const groupId = shift.groupId;
    await assertMemberApproved(groupId, user.id);

    const requirement = await ShiftRequirement.findOne({ shiftId, positionId: body.positionId });
    if (!requirement) {
      throw new AppError(400, 'Vị trí không hợp lệ cho ca này');
    }

    const configuredCount = await MemberPosition.countDocuments({ userId: user.id, groupId });
    if (configuredCount > 0) {
      const allowed = await MemberPosition.findOne({
        userId: user.id,
        groupId,
        positionId: body.positionId,
      }).lean();
      if (!allowed) {
        throw new AppError(400, 'Bạn chưa được gán vị trí này trong nhóm');
      }
    }

    const availabilities = await Availability.find({ userId: user.id }).lean();
    if (!shiftMatchesMemberAvailability(shift, availabilities)) {
      throw new AppError(400, 'Khung giờ ca không khớp lịch rảnh của bạn');
    }

    const existing = await Registration.findOne({
      shiftId,
      userId: user.id,
      status: { $in: ['PENDING', 'APPROVED'] },
    }).lean();
    if (existing) {
      throw new AppError(409, 'Bạn đã đăng ký ca này');
    }

    const id = await getNextSequence('Registration');
    const note = body.note?.trim() || undefined;

    await Registration.create({
      id,
      shiftId,
      userId: user.id,
      positionId: body.positionId,
      status: 'PENDING',
      note,
    });

    const reg = await Registration.findOne({ id }).lean();
    if (!reg) throw new AppError(500, 'Lỗi tạo đăng ký');

    await groupAuditService.recordEvent({
      groupId,
      actorUserId: user.id,
      actorRole: 'MEMBER',
      actionType: 'REGISTRATION_CREATED',
      entityType: 'REGISTRATION',
      entityId: reg.id,
      summary: 'Đăng ký ca làm việc',
      beforeData: null,
      afterData: { registrationId: reg.id, shiftId, positionId: body.positionId },
      metadata: { source: 'register' },
    });

    return toDto(reg);
  },

  async listPendingForShift(username: string, shiftId: number) {
    const user = await User.findOne({ username });
    if (!user) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');

    const shift = await Shift.findOne({ id: shiftId });
    if (!shift) throw new AppError(404, 'Không tìm thấy ca làm việc');
    await assertManager(shift.groupId, user.id, 'Chỉ Quản lý mới xem được danh sách chờ duyệt');

    const regs = await Registration.find({ shiftId, status: 'PENDING' }).sort({ id: 1 }).lean();
    return Promise.all(regs.map((r) => toDto(r)));
  },

  async assignDirectly(username: string, shiftId: number, body: { userId: number; positionId: number }) {
    const manager = await User.findOne({ username });
    if (!manager) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');

    const shift = await Shift.findOne({ id: shiftId });
    if (!shift) throw new AppError(404, 'Không tìm thấy ca làm việc');
    if (shift.status !== 'OPEN') {
      throw new AppError(400, 'Chỉ có thể gán khi ca đang mở');
    }

    const groupId = shift.groupId;
    await assertManager(groupId, manager.id, 'Chỉ Quản lý mới gán nhân viên');

    const member = await GroupMember.findOne({ groupId, userId: body.userId, status: 'APPROVED' });
    if (!member) {
      throw new AppError(400, 'Người dùng không phải thành viên đã duyệt trong nhóm');
    }

    const requirement = await ShiftRequirement.findOne({ shiftId, positionId: body.positionId });
    if (!requirement) {
      throw new AppError(400, 'Vị trí không hợp lệ cho ca này');
    }

    const approvedSame = await Registration.findOne({
      shiftId,
      userId: body.userId,
      status: 'APPROVED',
    }).lean();
    if (approvedSame) {
      throw new AppError(409, 'Nhân viên đã được gán vào ca này');
    }

    await assertQuotaAvailable(shiftId, body.positionId);
    await assertNoOverlappingApprovedShift(groupId, body.userId, shift);

    await Registration.deleteMany({ shiftId, userId: body.userId, status: 'PENDING' });

    const id = await getNextSequence('Registration');
    await Registration.create({
      id,
      shiftId,
      userId: body.userId,
      positionId: body.positionId,
      status: 'APPROVED',
    });

    const reg = await Registration.findOne({ id }).lean();
    if (!reg) throw new AppError(500, 'Lỗi gán ca');

    await groupAuditService.recordEvent({
      groupId,
      actorUserId: manager.id,
      actorRole: 'MANAGER',
      actionType: 'REGISTRATION_APPROVED',
      entityType: 'REGISTRATION',
      entityId: reg.id,
      summary: 'Gán nhân viên vào ca',
      beforeData: null,
      afterData: { registrationId: reg.id, shiftId, userId: body.userId, positionId: body.positionId },
      metadata: { source: 'assign' },
    });

    return toDto(reg);
  },

  async approveRegistration(username: string, registrationId: number) {
    const manager = await User.findOne({ username });
    if (!manager) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');

    const reg = await Registration.findOne({ id: registrationId });
    if (!reg) throw new AppError(404, 'Không tìm thấy đăng ký');
    if (reg.status !== 'PENDING') {
      throw new AppError(400, 'Chỉ có thể duyệt đăng ký đang chờ');
    }

    const shift = await Shift.findOne({ id: reg.shiftId });
    if (!shift) throw new AppError(404, 'Không tìm thấy ca làm việc');
    if (shift.status !== 'OPEN') {
      throw new AppError(400, 'Ca không còn mở để duyệt');
    }

    const groupId = shift.groupId;
    await assertManager(groupId, manager.id, 'Chỉ Quản lý mới duyệt đăng ký');

    await assertQuotaAvailable(reg.shiftId, reg.positionId);
    await assertNoOverlappingApprovedShift(groupId, reg.userId, shift);

    reg.status = 'APPROVED';
    await reg.save();

    const after = await Registration.findOne({ id: registrationId }).lean();
    if (!after) throw new AppError(500, 'Lỗi');

    await groupAuditService.recordEvent({
      groupId,
      actorUserId: manager.id,
      actorRole: 'MANAGER',
      actionType: 'REGISTRATION_APPROVED',
      entityType: 'REGISTRATION',
      entityId: reg.id,
      summary: 'Duyệt đăng ký ca',
      beforeData: { status: 'PENDING' },
      afterData: { status: 'APPROVED', registrationId: reg.id },
      metadata: { source: 'approve' },
    });

    return toDto(after);
  },

  async rejectRegistration(username: string, registrationId: number, body: { managerNote?: string | null }) {
    const manager = await User.findOne({ username });
    if (!manager) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');

    const reg = await Registration.findOne({ id: registrationId });
    if (!reg) throw new AppError(404, 'Không tìm thấy đăng ký');
    if (reg.status !== 'PENDING') {
      throw new AppError(400, 'Chỉ có thể từ chối đăng ký đang chờ');
    }

    const shift = await Shift.findOne({ id: reg.shiftId });
    if (!shift) throw new AppError(404, 'Không tìm thấy ca làm việc');

    const groupId = shift.groupId;
    await assertManager(groupId, manager.id, 'Chỉ Quản lý mới từ chối đăng ký');

    reg.status = 'REJECTED';
    reg.managerNote = body.managerNote?.trim() || undefined;
    await reg.save();

    const after = await Registration.findOne({ id: registrationId }).lean();
    if (!after) throw new AppError(500, 'Lỗi');

    await groupAuditService.recordEvent({
      groupId,
      actorUserId: manager.id,
      actorRole: 'MANAGER',
      actionType: 'REGISTRATION_REJECTED',
      entityType: 'REGISTRATION',
      entityId: reg.id,
      summary: 'Từ chối đăng ký ca',
      beforeData: { status: 'PENDING' },
      afterData: { status: 'REJECTED', registrationId: reg.id },
      metadata: null,
    });

    return toDto(after);
  },

  async cancelRegistration(username: string, registrationId: number, body: { note?: string | null }) {
    const user = await User.findOne({ username });
    if (!user) throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');

    const reg = await Registration.findOne({ id: registrationId });
    if (!reg) throw new AppError(404, 'Không tìm thấy đăng ký');
    if (reg.userId !== user.id) {
      throw new AppError(403, 'Chỉ có thể hủy đăng ký của chính bạn');
    }

    const shift = await Shift.findOne({ id: reg.shiftId });
    if (!shift) throw new AppError(404, 'Không tìm thấy ca làm việc');
    if (shift.status === 'LOCKED' || shift.status === 'COMPLETED') {
      throw new AppError(400, 'Không thể hủy đăng ký cho ca đã khóa hoặc đã hoàn thành');
    }

    const now = new Date();
    const start = shiftStartDate(shift);
    const prevStatus = reg.status;

    if (prevStatus === 'PENDING') {
      const noteExtra = body.note?.trim();
      if (noteExtra) reg.note = noteExtra;
    } else if (prevStatus === 'APPROVED') {
      if (now >= start) {
        throw new AppError(400, 'Không thể hủy sau khi ca đã bắt đầu');
      }
    } else {
      throw new AppError(400, 'Trạng thái đăng ký không cho phép hủy');
    }

    reg.status = 'CANCELLED';
    await reg.save();

    const after = await Registration.findOne({ id: registrationId }).lean();
    if (!after) throw new AppError(500, 'Lỗi');

    await groupAuditService.recordEvent({
      groupId: shift.groupId,
      actorUserId: user.id,
      actorRole: 'MEMBER',
      actionType: 'REGISTRATION_CANCELLED',
      entityType: 'REGISTRATION',
      entityId: reg.id,
      summary: 'Hủy đăng ký ca',
      beforeData: { status: prevStatus },
      afterData: { status: 'CANCELLED', registrationId: reg.id },
      metadata: null,
    });

    return toDto(after);
  },
};
