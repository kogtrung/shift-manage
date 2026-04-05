import { AppError } from '../common/appError';
import { Availability } from '../models/Availability';
import { Group } from '../models/Group';
import { Position } from '../models/Position';
import { Registration } from '../models/Registration';
import { Shift } from '../models/Shift';
import { ShiftRequirement } from '../models/ShiftRequirement';
import { ShiftTemplate } from '../models/ShiftTemplate';
import { TemplateRequirement } from '../models/TemplateRequirement';
import { User } from '../models/User';
import { getNextSequence } from './sequenceService';
import { assertGroupMember } from './membership';
import { isoDayOfWeekFromDateString, normalizeTimeString, timeRangesOverlap, timeToSeconds } from '../utils/time';

function safeNorm(t: string | undefined): string {
  if (!t) {
    throw new AppError(400, 'Thiếu giờ');
  }
  try {
    return normalizeTimeString(t);
  } catch {
    throw new AppError(400, 'Định dạng giờ không hợp lệ');
  }
}

function normBlank(s: string | undefined | null): string | null {
  if (s == null) return null;
  const t = s.trim();
  return t.length ? t : null;
}

function toShiftRequirementDto(
  r: { id: number; shiftId: number; positionId: number; quantity: number },
  pos: { name: string; colorCode?: string } | undefined
) {
  return {
    id: r.id,
    shiftId: r.shiftId,
    positionId: r.positionId,
    positionName: pos?.name ?? '',
    positionColorCode: pos?.colorCode ?? null,
    quantity: r.quantity,
  };
}

function toCreateShiftResponse(
  shift: {
    id: number;
    groupId: number;
    templateId?: number;
    name?: string;
    date: string;
    startTime: string;
    endTime: string;
    note?: string;
    status: string;
  },
  requirements: ReturnType<typeof toShiftRequirementDto>[],
  assignedMembers: Array<{
    userId: number;
    fullName: string;
    username: string;
    positionId: number;
    positionName: string;
    colorCode: string | null;
  }>
) {
  const totalRequired = requirements.reduce((s, r) => s + r.quantity, 0);
  return {
    id: shift.id,
    groupId: shift.groupId,
    templateId: shift.templateId ?? null,
    name: shift.name ?? null,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    note: shift.note ?? null,
    status: shift.status,
    requirements,
    totalRequired,
    assignedMembers,
  };
}

async function loadRequirementsForShift(shiftId: number) {
  const reqs = await ShiftRequirement.find({ shiftId }).lean();
  const posIds = reqs.map((r) => r.positionId);
  const positions = await Position.find({ id: { $in: posIds } }).lean();
  const pmap = new Map(positions.map((p) => [p.id, p]));
  return reqs.map((r) => toShiftRequirementDto(r, pmap.get(r.positionId)));
}

async function loadApprovedMembers(shiftId: number) {
  const regs = await Registration.find({ shiftId, status: 'APPROVED' }).lean();
  const userIds = regs.map((r) => r.userId);
  const posIds = regs.map((r) => r.positionId);
  const [users, positions] = await Promise.all([
    User.find({ id: { $in: userIds } }).lean(),
    Position.find({ id: { $in: posIds } }).lean(),
  ]);
  const uMap = new Map(users.map((u) => [u.id, u]));
  const pMap = new Map(positions.map((p) => [p.id, p]));
  return regs.map((r) => {
    const u = uMap.get(r.userId);
    const p = pMap.get(r.positionId);
    const fullName =
      u?.fullName && u.fullName.trim() ? u.fullName : (u?.username ?? '');
    return {
      userId: r.userId,
      fullName,
      username: u?.username ?? '',
      positionId: r.positionId,
      positionName: p?.name ?? '',
      colorCode: p?.colorCode ?? null,
    };
  });
}

async function findOverlapping(
  groupId: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeShiftId?: number
): Promise<boolean> {
  const existing = await Shift.find({ groupId, date }).lean();
  return existing.some(
    (s) =>
      s.id !== excludeShiftId &&
      timeRangesOverlap(s.startTime, s.endTime, startTime, endTime)
  );
}

async function copyTemplateRequirementsToShift(shiftId: number, templateId: number) {
  const tplReqs = await TemplateRequirement.find({ templateId }).lean();
  for (const tr of tplReqs) {
    const id = await getNextSequence('ShiftRequirement');
    await ShiftRequirement.create({
      id,
      shiftId,
      positionId: tr.positionId,
      quantity: tr.quantity,
    });
  }
}

type CreateShiftBody = {
  name?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  templateId?: number;
  note?: string;
};

async function resolveInput(groupId: number, request: CreateShiftBody) {
  let name = normBlank(request.name);
  let templateId: number | undefined;
  let startTime: string;
  let endTime: string;

  if (request.templateId != null) {
    const tpl = await ShiftTemplate.findOne({ id: request.templateId, groupId });
    if (!tpl) {
      throw new AppError(404, 'Không tìm thấy ca mẫu');
    }
    if (request.startTime != null || request.endTime != null) {
      throw new AppError(400, 'Đã chọn ca mẫu thì không được nhập giờ thủ công');
    }
    if (name == null) {
      name = tpl.name;
    }
    startTime = tpl.startTime;
    endTime = tpl.endTime;
    templateId = tpl.id;
  } else {
    if (!request.startTime || !request.endTime) {
      throw new AppError(400, 'Giờ bắt đầu và giờ kết thúc không được để trống');
    }
    startTime = safeNorm(request.startTime);
    endTime = safeNorm(request.endTime);
  }

  if (timeToSeconds(startTime) >= timeToSeconds(endTime)) {
    throw new AppError(400, 'Giờ bắt đầu phải trước giờ kết thúc');
  }

  const note = normBlank(request.note);
  return { templateId, name: name ?? undefined, startTime, endTime, note: note ?? undefined };
}

export const shiftService = {
  async getShifts(groupId: number, username: string, from?: string, to?: string) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng');
    }

    const g0 = await Group.findOne({ id: groupId });
    if (!g0) {
      throw new AppError(404, 'Không tìm thấy nhóm');
    }
    await assertGroupMember(groupId, user.id);

    let shifts;
    if (from && to) {
      shifts = await Shift.find({
        groupId,
        date: { $gte: from, $lte: to },
      })
        .sort({ date: 1, startTime: 1 })
        .lean();
    } else {
      shifts = await Shift.find({ groupId }).sort({ date: 1, startTime: 1 }).lean();
    }

    const out = [];
    for (const s of shifts) {
      const requirements = await loadRequirementsForShift(s.id);
      const assignedMembers = await loadApprovedMembers(s.id);
      out.push(toCreateShiftResponse(s, requirements, assignedMembers));
    }
    return out;
  },

  async createShift(groupId: number, username: string, request: CreateShiftBody) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng');
    }

    const g1 = await Group.findOne({ id: groupId });
    if (!g1) {
      throw new AppError(404, 'Không tìm thấy nhóm');
    }
    const m = await assertGroupMember(groupId, user.id);
    if (m.role !== 'MANAGER' || m.status !== 'APPROVED') {
      throw new AppError(403, 'Chỉ Quản lý mới có quyền tạo ca làm việc');
    }

    if (!request.date) {
      throw new AppError(400, 'Ngày làm việc không được để trống');
    }

    const resolved = await resolveInput(groupId, request);

    const overlap = await findOverlapping(groupId, request.date, resolved.startTime, resolved.endTime);
    if (overlap) {
      throw new AppError(409, 'Ca làm việc bị trùng lặp thời gian với ca khác trong cùng ngày');
    }

    const id = await getNextSequence('Shift');
    await Shift.create({
      id,
      groupId,
      templateId: resolved.templateId,
      name: resolved.name,
      date: request.date,
      startTime: resolved.startTime,
      endTime: resolved.endTime,
      note: resolved.note,
      status: 'OPEN',
    });

    if (resolved.templateId != null) {
      await copyTemplateRequirementsToShift(id, resolved.templateId);
    }

    const shift = await Shift.findOne({ id }).lean();
    if (!shift) {
      throw new AppError(500, 'Lỗi tạo ca');
    }
    return toCreateShiftResponse(shift, [], []);
  },

  async createShiftsBulk(groupId: number, username: string, requests: CreateShiftBody[]) {
    if (!requests?.length) {
      throw new AppError(400, 'Danh sách ca không được để trống');
    }
    const results = [];
    for (const req of requests) {
      results.push(await this.createShift(groupId, username, req));
    }
    return results;
  },

  async deleteShift(groupId: number, shiftId: number, username: string) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng');
    }
    const m = await assertGroupMember(groupId, user.id);
    if (m.role !== 'MANAGER' || m.status !== 'APPROVED') {
      throw new AppError(403, 'Chỉ Quản lý mới có quyền xóa ca làm việc');
    }

    const shift = await Shift.findOne({ id: shiftId });
    if (!shift) {
      throw new AppError(404, 'Không tìm thấy ca làm việc');
    }
    if (shift.groupId !== groupId) {
      throw new AppError(403, 'Ca làm việc không thuộc nhóm này');
    }

    await Registration.deleteMany({ shiftId });
    await ShiftRequirement.deleteMany({ shiftId });
    await Shift.deleteOne({ id: shiftId });
  },

  async lockShift(groupId: number, shiftId: number, username: string) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng');
    }

    const g1 = await Group.findOne({ id: groupId });
    if (!g1) {
      throw new AppError(404, 'Không tìm thấy nhóm');
    }
    const m = await assertGroupMember(groupId, user.id);
    if (m.role !== 'MANAGER' || m.status !== 'APPROVED') {
      throw new AppError(403, 'Chỉ Quản lý mới có quyền khóa ca làm việc');
    }

    const shift = await Shift.findOne({ id: shiftId, groupId });
    if (!shift) {
      throw new AppError(404, 'Không tìm thấy ca làm việc');
    }
    if (shift.status !== 'OPEN') {
      throw new AppError(400, 'Chỉ có thể khóa ca đang ở trạng thái OPEN');
    }

    shift.status = 'LOCKED';
    await shift.save();

    await Registration.updateMany(
      { shiftId, status: 'PENDING' },
      { $set: { status: 'REJECTED', managerNote: 'Ca đã bị khóa' } }
    );

    const shiftLean = await Shift.findOne({ id: shiftId }).lean();
    if (!shiftLean) {
      throw new AppError(500, 'Lỗi');
    }
    return toCreateShiftResponse(shiftLean, [], []);
  },

  async getAvailableShifts(groupId: number, username: string) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng');
    }

    const g1 = await Group.findOne({ id: groupId });
    if (!g1) {
      throw new AppError(404, 'Không tìm thấy nhóm');
    }
    const m = await assertGroupMember(groupId, user.id);
    if (m.status !== 'APPROVED') {
      throw new AppError(403, 'Tài khoản của bạn chưa được duyệt trong nhóm này');
    }

    const availabilities = await Availability.find({ userId: user.id }).lean();
    const openShifts = await Shift.find({ groupId, status: 'OPEN' })
      .sort({ date: 1, startTime: 1 })
      .lean();

    const filtered = openShifts.filter(
      (shift) =>
        shiftMatchesMemberAvailability(shift, availabilities) && hasAvailableSlots(shift.id)
    );

    const out = [];
    for (const shift of filtered) {
      const reqs = await ShiftRequirement.find({ shiftId: shift.id }).lean();
      const totalSlots = reqs.reduce((s, r) => s + r.quantity, 0);
      out.push({
        id: shift.id,
        groupId,
        name: shift.name ?? null,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        note: shift.note ?? null,
        status: shift.status,
        totalSlots,
      });
    }
    return out;
  },
};

export function shiftMatchesMemberAvailability(
  shift: { date: string; startTime: string; endTime: string },
  availabilities: Array<{ dayOfWeek: number; startTime: string; endTime: string }>
): boolean {
  if (!availabilities.length) return false;
  const dow = isoDayOfWeekFromDateString(shift.date);
  return availabilities.some((avail) => {
    if (avail.dayOfWeek !== dow) return false;
    const as = timeToSeconds(avail.startTime);
    const ae = timeToSeconds(avail.endTime);
    const ss = timeToSeconds(shift.startTime);
    const se = timeToSeconds(shift.endTime);
    return as <= ss && ae >= se;
  });
}

async function hasAvailableSlots(shiftId: number): Promise<boolean> {
  const reqs = await ShiftRequirement.find({ shiftId }).lean();
  return reqs.some((r) => r.quantity > 0);
}
