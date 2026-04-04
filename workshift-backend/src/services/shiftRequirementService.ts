import { AppError } from '../common/appError';
import { Position } from '../models/Position';
import { Shift } from '../models/Shift';
import { ShiftRequirement } from '../models/ShiftRequirement';
import { User } from '../models/User';
import { getNextSequence } from './sequenceService';
import { assertManager, assertMemberApproved } from './membership';

function toResponse(
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

export const shiftRequirementService = {
  async createRequirement(
    username: string,
    shiftId: number,
    body: { positionId: number; quantity: number }
  ) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }

    const shift = await Shift.findOne({ id: shiftId });
    if (!shift) {
      throw new AppError(404, 'Không tìm thấy ca làm việc');
    }
    const groupId = shift.groupId;
    await assertManager(groupId, user.id, 'Bạn không có quyền cấu hình nhu cầu');

    const position = await Position.findOne({ id: body.positionId, groupId });
    if (!position) {
      throw new AppError(404, 'Không tìm thấy vị trí');
    }

    const dup = await ShiftRequirement.findOne({ shiftId, positionId: body.positionId });
    if (dup) {
      throw new AppError(409, 'Vị trí đã được cấu hình trong ca này');
    }

    const id = await getNextSequence('ShiftRequirement');
    await ShiftRequirement.create({
      id,
      shiftId,
      positionId: body.positionId,
      quantity: body.quantity,
    });

    const r = await ShiftRequirement.findOne({ id }).lean();
    if (!r) {
      throw new AppError(500, 'Lỗi tạo nhu cầu ca');
    }
    return toResponse(r, { name: position.name, colorCode: position.colorCode });
  },

  async updateRequirement(
    username: string,
    shiftId: number,
    requirementId: number,
    body: { positionId: number; quantity: number }
  ) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }

    const shift = await Shift.findOne({ id: shiftId });
    if (!shift) {
      throw new AppError(404, 'Không tìm thấy ca làm việc');
    }
    const groupId = shift.groupId;
    await assertManager(groupId, user.id, 'Bạn không có quyền cấu hình nhu cầu');

    const requirement = await ShiftRequirement.findOne({ id: requirementId, shiftId });
    if (!requirement) {
      throw new AppError(404, 'Không tìm thấy cấu hình nhu cầu');
    }

    const position = await Position.findOne({ id: body.positionId, groupId });
    if (!position) {
      throw new AppError(404, 'Không tìm thấy vị trí');
    }

    if (
      requirement.positionId !== body.positionId &&
      (await ShiftRequirement.findOne({ shiftId, positionId: body.positionId }))
    ) {
      throw new AppError(409, 'Vị trí đã được cấu hình trong ca này');
    }

    requirement.positionId = body.positionId;
    requirement.quantity = body.quantity;
    await requirement.save();

    const pos = await Position.findOne({ id: body.positionId });
    if (!pos) {
      throw new AppError(404, 'Không tìm thấy vị trí');
    }
    return toResponse(
      {
        id: requirement.id,
        shiftId,
        positionId: requirement.positionId,
        quantity: requirement.quantity,
      },
      { name: pos.name, colorCode: pos.colorCode }
    );
  },

  async getRequirements(username: string, shiftId: number) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }

    const shift = await Shift.findOne({ id: shiftId });
    if (!shift) {
      throw new AppError(404, 'Không tìm thấy ca làm việc');
    }
    await assertMemberApproved(shift.groupId, user.id);

    const reqs = await ShiftRequirement.find({ shiftId }).lean();
    const posIds = reqs.map((r) => r.positionId);
    const positions = await Position.find({ id: { $in: posIds } }).lean();
    const pmap = new Map(positions.map((p) => [p.id, p]));
    return reqs.map((r) => toResponse(r, pmap.get(r.positionId)));
  },

  async deleteRequirement(username: string, shiftId: number, requirementId: number) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }

    const shift = await Shift.findOne({ id: shiftId });
    if (!shift) {
      throw new AppError(404, 'Không tìm thấy ca làm việc');
    }
    await assertManager(shift.groupId, user.id, 'Bạn không có quyền cấu hình nhu cầu');

    const requirement = await ShiftRequirement.findOne({ id: requirementId, shiftId });
    if (!requirement) {
      throw new AppError(404, 'Không tìm thấy cấu hình nhu cầu');
    }

    await ShiftRequirement.deleteOne({ id: requirementId });
  },
};
