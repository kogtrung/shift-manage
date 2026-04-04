import { AppError } from '../common/appError';
import { Group } from '../models/Group';
import { Position } from '../models/Position';
import { User } from '../models/User';
import { getNextSequence } from './sequenceService';
import { assertManager, assertMemberApproved } from './membership';

export const positionService = {
  async createPosition(
    username: string,
    groupId: number,
    body: { name: string; colorCode?: string }
  ) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await assertManager(groupId, user.id, 'Bạn không có quyền quản lý vị trí');

    const group = await Group.findOne({ id: groupId });
    if (!group) {
      throw new AppError(404, 'Không tìm thấy group');
    }

    const trimmedName = body.name.trim();
    const dup = await Position.findOne({ groupId, name: trimmedName });
    if (dup) {
      throw new AppError(409, 'Tên vị trí đã tồn tại trong group');
    }

    const id = await getNextSequence('Position');
    await Position.create({
      id,
      groupId,
      name: trimmedName,
      colorCode: body.colorCode?.trim() || undefined,
    });

    return {
      id,
      groupId,
      name: trimmedName,
      colorCode: body.colorCode?.trim() || null,
    };
  },

  async getPositions(username: string, groupId: number) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await assertMemberApproved(groupId, user.id);

    const list = await Position.find({ groupId }).sort({ id: 1 }).lean();
    return list.map((p) => ({
      id: p.id,
      groupId,
      name: p.name,
      colorCode: p.colorCode ?? null,
    }));
  },

  async updatePosition(
    username: string,
    groupId: number,
    positionId: number,
    body: { name: string; colorCode?: string }
  ) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await assertManager(groupId, user.id, 'Bạn không có quyền quản lý vị trí');

    const position = await Position.findOne({ id: positionId, groupId });
    if (!position) {
      throw new AppError(404, 'Không tìm thấy vị trí');
    }

    const trimmedName = body.name.trim();
    const dup = await Position.findOne({
      groupId,
      name: trimmedName,
      id: { $ne: positionId },
    });
    if (dup) {
      throw new AppError(409, 'Tên vị trí đã tồn tại trong group');
    }

    position.name = trimmedName;
    position.colorCode = body.colorCode?.trim() || undefined;
    await position.save();

    return {
      id: position.id,
      groupId,
      name: position.name,
      colorCode: position.colorCode ?? null,
    };
  },

  async deletePosition(username: string, groupId: number, positionId: number) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await assertManager(groupId, user.id, 'Bạn không có quyền quản lý vị trí');

    const position = await Position.findOne({ id: positionId, groupId });
    if (!position) {
      throw new AppError(404, 'Không tìm thấy vị trí');
    }

    await Position.deleteOne({ id: positionId });
  },
};
