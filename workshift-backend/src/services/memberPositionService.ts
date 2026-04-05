import { AppError } from '../common/appError';
import { Group } from '../models/Group';
import { MemberPosition } from '../models/MemberPosition';
import { Position } from '../models/Position';
import { User } from '../models/User';
import { getNextSequence } from './sequenceService';
import { assertMemberApproved } from './membership';

export const memberPositionService = {
  async getMyPositions(username: string, groupId: number) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }

    const g = await Group.findOne({ id: groupId });
    if (!g) {
      throw new AppError(404, 'Không tìm thấy nhóm');
    }
    await assertMemberApproved(groupId, user.id);

    const links = await MemberPosition.find({ userId: user.id, groupId }).lean();
    if (!links.length) {
      return [];
    }
    const posIds = links.map((l) => l.positionId);
    const positions = await Position.find({ groupId, id: { $in: posIds } }).lean();
    const pmap = new Map(positions.map((p) => [p.id, p]));
    return links
      .map((l) => {
        const p = pmap.get(l.positionId);
        if (!p) return null;
        return {
          id: p.id,
          name: p.name,
          colorCode: p.colorCode ?? null,
        };
      })
      .filter(Boolean);
  },

  async replaceMyPositions(username: string, groupId: number, positionIds: number[]) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }

    const g = await Group.findOne({ id: groupId });
    if (!g) {
      throw new AppError(404, 'Không tìm thấy nhóm');
    }
    await assertMemberApproved(groupId, user.id);

    const unique = [...new Set(positionIds)];
    if (unique.length) {
      const found = await Position.find({ groupId, id: { $in: unique } }).lean();
      if (found.length !== unique.length) {
        throw new AppError(400, 'Một hoặc nhiều vị trí không thuộc nhóm này');
      }
    }

    await MemberPosition.deleteMany({ userId: user.id, groupId });

    for (const pid of unique) {
      const id = await getNextSequence('MemberPosition');
      await MemberPosition.create({
        id,
        userId: user.id,
        groupId,
        positionId: pid,
      });
    }

    const links = await MemberPosition.find({ userId: user.id, groupId }).lean();
    if (!links.length) {
      return [];
    }
    const posIds = links.map((l) => l.positionId);
    const positions = await Position.find({ groupId, id: { $in: posIds } }).lean();
    const pmap = new Map(positions.map((p) => [p.id, p]));
    return links
      .map((l) => {
        const p = pmap.get(l.positionId);
        if (!p) return null;
        return {
          id: p.id,
          name: p.name,
          colorCode: p.colorCode ?? null,
        };
      })
      .filter(Boolean);
  },
};
