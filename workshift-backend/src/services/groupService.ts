import { AppError } from '../common/appError';
import { Group } from '../models/Group';
import { GroupMember } from '../models/GroupMember';
import { GroupAuditLog } from '../models/GroupAuditLog';
import { MemberPosition } from '../models/MemberPosition';
import { SalaryConfig } from '../models/SalaryConfig';
import { ShiftChangeRequest } from '../models/ShiftChangeRequest';
import { Position } from '../models/Position';
import { Registration } from '../models/Registration';
import { Shift } from '../models/Shift';
import { ShiftRequirement } from '../models/ShiftRequirement';
import { ShiftTemplate } from '../models/ShiftTemplate';
import { TemplateRequirement } from '../models/TemplateRequirement';
import { User } from '../models/User';
import type { GroupMemberReviewAction } from '../types/group';
import { getNextSequence } from './sequenceService';
import { groupAuditService } from './groupAuditService';

const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomJoinCode(): string {
  let code = '';
  for (let j = 0; j < 6; j += 1) {
    code += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)];
  }
  return code;
}

async function generateUniqueJoinCode(): Promise<string> {
  for (let i = 0; i < 20; i += 1) {
    const code = randomJoinCode();
    const exists = await Group.exists({ joinCode: code });
    if (!exists) return code;
  }
  throw new AppError(500, 'Không thể tạo mã tham gia group, vui lòng thử lại');
}

function toCreateGroupResponse(g: {
  id: number;
  name: string;
  description?: string;
  joinCode: string;
  status: string;
  createdByUserId: number;
}) {
  return {
    id: g.id,
    name: g.name,
    description: g.description ?? null,
    joinCode: g.joinCode,
    status: g.status,
    createdByUserId: g.createdByUserId,
  };
}

async function joinGroupInternal(user: { id: number }, group: { id: number; status: string }) {
  if (group.status !== 'ACTIVE') {
    throw new AppError(400, 'Group hiện không hoạt động');
  }
  const existing = await GroupMember.findOne({ groupId: group.id, userId: user.id });
  if (existing) {
    throw new AppError(409, 'Bạn đã tham gia hoặc gửi yêu cầu vào group này');
  }

  const memberId = await getNextSequence('GroupMember');
  await GroupMember.create({
    id: memberId,
    groupId: group.id,
    userId: user.id,
    role: 'MEMBER',
    status: 'PENDING',
    joinedAt: null,
  });

  await groupAuditService.recordEvent({
    groupId: group.id,
    actorUserId: user.id,
    actorRole: 'MEMBER',
    actionType: 'GROUP_MEMBER_JOIN_REQUESTED',
    entityType: 'GROUP_MEMBER',
    entityId: memberId,
    summary: 'Gửi yêu cầu tham gia group',
    beforeData: null,
    afterData: {
      groupId: group.id,
      userId: user.id,
      status: 'PENDING',
    },
    metadata: { source: 'join_group' },
  });

  return {
    groupId: group.id,
    userId: user.id,
    role: 'MEMBER',
    status: 'PENDING',
  };
}

export const groupService = {
  async createGroup(username: string, body: { name: string; description?: string }) {
    const creator = await User.findOne({ username });
    if (!creator) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }

    const groupId = await getNextSequence('Group');
    const joinCode = await generateUniqueJoinCode();

    await Group.create({
      id: groupId,
      name: body.name.trim(),
      description: body.description?.trim() || undefined,
      joinCode,
      createdByUserId: creator.id,
      status: 'ACTIVE',
    });

    const memberId = await getNextSequence('GroupMember');
    await GroupMember.create({
      id: memberId,
      groupId,
      userId: creator.id,
      role: 'MANAGER',
      status: 'APPROVED',
      joinedAt: new Date(),
    });

    await groupAuditService.recordEvent({
      groupId,
      actorUserId: creator.id,
      actorRole: 'MANAGER',
      actionType: 'GROUP_CREATED',
      entityType: 'GROUP',
      entityId: groupId,
      summary: 'Tạo group mới',
      beforeData: null,
      afterData: {
        groupId,
        name: body.name.trim(),
        joinCode,
      },
      metadata: { source: 'create_group' },
    });

    return toCreateGroupResponse({
      id: groupId,
      name: body.name.trim(),
      description: body.description,
      joinCode,
      status: 'ACTIVE',
      createdByUserId: creator.id,
    });
  },

  async updateGroup(username: string, groupId: number, body: { name: string; description?: string }) {
    const manager = await User.findOne({ username });
    if (!manager) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await this.validateManagerPermission(groupId, manager.id);

    const group = await Group.findOne({ id: groupId });
    if (!group) {
      throw new AppError(404, 'Không tìm thấy group');
    }

    const oldValues = {
      name: group.name,
      description: group.description ?? '',
    };

    group.name = body.name.trim();
    group.description = body.description?.trim() || undefined;
    await group.save();

    await groupAuditService.recordEvent({
      groupId,
      actorUserId: manager.id,
      actorRole: 'MANAGER',
      actionType: 'GROUP_UPDATED',
      entityType: 'GROUP',
      entityId: groupId,
      summary: 'Cập nhật thông tin group',
      beforeData: oldValues,
      afterData: {
        name: group.name,
        description: group.description ?? '',
      },
      metadata: { source: 'update_group' },
    });

    return toCreateGroupResponse({
      id: group.id,
      name: group.name,
      description: group.description,
      joinCode: group.joinCode,
      status: group.status,
      createdByUserId: group.createdByUserId,
    });
  },

  async toggleGroupStatus(username: string, groupId: number) {
    const manager = await User.findOne({ username });
    if (!manager) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await this.validateManagerPermission(groupId, manager.id);

    const group = await Group.findOne({ id: groupId });
    if (!group) {
      throw new AppError(404, 'Không tìm thấy group');
    }

    const oldStatus = group.status;
    const newStatus = oldStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    group.status = newStatus;
    await group.save();

    const actionType =
      newStatus === 'INACTIVE' ? ('GROUP_CLOSED' as const) : ('GROUP_REOPENED' as const);
    const summary = newStatus === 'INACTIVE' ? 'Đóng group' : 'Mở lại group';

    await groupAuditService.recordEvent({
      groupId,
      actorUserId: manager.id,
      actorRole: 'MANAGER',
      actionType,
      entityType: 'GROUP',
      entityId: groupId,
      summary,
      beforeData: { status: oldStatus },
      afterData: { status: newStatus },
      metadata: { source: 'toggle_group_status' },
    });

    return toCreateGroupResponse({
      id: group.id,
      name: group.name,
      description: group.description,
      joinCode: group.joinCode,
      status: group.status,
      createdByUserId: group.createdByUserId,
    });
  },

  async deleteGroupPermanently(username: string, groupId: number) {
    const manager = await User.findOne({ username });
    if (!manager) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await this.validateManagerPermission(groupId, manager.id);

    const group = await Group.findOne({ id: groupId });
    if (!group) {
      throw new AppError(404, 'Không tìm thấy group');
    }

    await ShiftChangeRequest.deleteMany({ groupId });

    const shifts = await Shift.find({ groupId }).select('id').lean();
    const shiftIds = shifts.map((s) => s.id);
    if (shiftIds.length > 0) {
      await ShiftRequirement.deleteMany({ shiftId: { $in: shiftIds } });
      await Registration.deleteMany({ shiftId: { $in: shiftIds } });
    }
    await Shift.deleteMany({ groupId });

    const templates = await ShiftTemplate.find({ groupId }).select('id').lean();
    const templateIds = templates.map((t) => t.id);
    if (templateIds.length > 0) {
      await TemplateRequirement.deleteMany({ templateId: { $in: templateIds } });
    }
    await ShiftTemplate.deleteMany({ groupId });
    await MemberPosition.deleteMany({ groupId });
    await SalaryConfig.deleteMany({ groupId });
    await Position.deleteMany({ groupId });

    await GroupAuditLog.deleteMany({ groupId });
    await GroupMember.deleteMany({ groupId });
    await Group.deleteOne({ id: groupId });
  },

  async getMyGroups(username: string) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }

    const members = await GroupMember.find({
      userId: user.id,
      status: { $in: ['APPROVED', 'PENDING'] },
    }).lean();

    const groupIds = members.map((m) => m.groupId);
    const groups = await Group.find({ id: { $in: groupIds } }).lean();
    const gMap = new Map(groups.map((g) => [g.id, g]));

    return members
      .map((member) => {
        const g = gMap.get(member.groupId);
        if (!g) {
          return null;
        }
        return {
          groupId: g.id,
          groupName: g.name,
          description: g.description ?? null,
          joinCode: g.joinCode,
          groupStatus: g.status,
          myRole: member.role,
          myMemberStatus: member.status,
        };
      })
      .filter(Boolean);
  },

  async joinGroup(username: string, groupId: number) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    const group = await Group.findOne({ id: groupId });
    if (!group) {
      throw new AppError(404, 'Không tìm thấy group');
    }
    return joinGroupInternal(user, group);
  },

  async joinGroupByCode(username: string, rawJoinCode: string) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    const normalized = rawJoinCode.trim().toUpperCase();
    const group = await Group.findOne({ joinCode: normalized });
    if (!group) {
      throw new AppError(404, 'Mã tham gia không hợp lệ');
    }
    return joinGroupInternal(user, group);
  },

  async getGroupMembers(username: string, groupId: number) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    const membership = await GroupMember.findOne({ groupId, userId: user.id });
    if (!membership) {
      throw new AppError(403, 'Bạn không thuộc group này');
    }
    if (membership.status !== 'APPROVED') {
      throw new AppError(403, 'Bạn chưa được duyệt vào group này');
    }

    const members = await GroupMember.find({ groupId, status: 'APPROVED' }).lean();
    const userIds = members.map((m) => m.userId);
    const users = await User.find({ id: { $in: userIds } }).lean();
    const uMap = new Map(users.map((u) => [u.id, u]));

    return members.map((m) => {
      const u = uMap.get(m.userId);
      return {
        memberId: m.id,
        groupId: m.groupId,
        userId: m.userId,
        username: u?.username ?? '',
        fullName: u?.fullName ?? '',
        email: u?.email ?? '',
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt ? m.joinedAt.toISOString() : null,
      };
    });
  },

  async leaveGroup(username: string, groupId: number) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    const membership = await GroupMember.findOne({ groupId, userId: user.id });
    if (!membership) {
      throw new AppError(404, 'Bạn không thuộc group này');
    }
    if (membership.role === 'MANAGER') {
      throw new AppError(400, 'Manager không thể rời group. Hãy chuyển quyền quản lý trước.');
    }

    await groupAuditService.recordEvent({
      groupId,
      actorUserId: user.id,
      actorRole: 'MEMBER',
      actionType: 'GROUP_MEMBER_REJECTED',
      entityType: 'GROUP_MEMBER',
      entityId: membership.id,
      summary: 'Thành viên rời group',
      beforeData: { status: membership.status },
      afterData: { status: 'LEFT' },
      metadata: { source: 'leave_group' },
    });

    await GroupMember.deleteOne({ id: membership.id });
  },

  async getPendingMembers(username: string, groupId: number) {
    const manager = await User.findOne({ username });
    if (!manager) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await this.validateManagerPermission(groupId, manager.id);

    const members = await GroupMember.find({ groupId, status: 'PENDING' }).lean();
    const userIds = members.map((m) => m.userId);
    const users = await User.find({ id: { $in: userIds } }).lean();
    const uMap = new Map(users.map((u) => [u.id, u]));

    return members.map((m) => {
      const u = uMap.get(m.userId);
      return {
        memberId: m.id,
        groupId: m.groupId,
        userId: m.userId,
        username: u?.username ?? '',
        fullName: u?.fullName ?? '',
        email: u?.email ?? '',
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt ? m.joinedAt.toISOString() : null,
      };
    });
  },

  async reviewMember(
    username: string,
    groupId: number,
    memberId: number,
    action: GroupMemberReviewAction
  ) {
    const manager = await User.findOne({ username });
    if (!manager) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await this.validateManagerPermission(groupId, manager.id);

    const groupMember = await GroupMember.findOne({ id: memberId, groupId });
    if (!groupMember) {
      throw new AppError(404, 'Không tìm thấy thành viên trong group');
    }
    if (groupMember.status !== 'PENDING') {
      throw new AppError(400, 'Chỉ có thể duyệt yêu cầu ở trạng thái PENDING');
    }

    const previousStatus = groupMember.status;
    const previousJoinedAt = groupMember.joinedAt;

    if (action === 'APPROVE') {
      groupMember.status = 'APPROVED';
      groupMember.joinedAt = new Date();
    } else {
      groupMember.status = 'REJECTED';
      groupMember.joinedAt = null;
    }
    await groupMember.save();

    await groupAuditService.recordEvent({
      groupId,
      actorUserId: manager.id,
      actorRole: 'MANAGER',
      actionType: action === 'APPROVE' ? 'GROUP_MEMBER_APPROVED' : 'GROUP_MEMBER_REJECTED',
      entityType: 'GROUP_MEMBER',
      entityId: groupMember.id,
      summary: 'Cập nhật trạng thái thành viên',
      beforeData: {
        status: previousStatus,
        joinedAt: previousJoinedAt ? previousJoinedAt.toISOString() : '',
      },
      afterData: {
        status: groupMember.status,
        joinedAt: groupMember.joinedAt ? groupMember.joinedAt.toISOString() : '',
      },
      metadata: {
        targetUserId: groupMember.userId,
        action,
      },
    });

    return {
      memberId: groupMember.id,
      groupId: groupMember.groupId,
      userId: groupMember.userId,
      role: groupMember.role,
      status: groupMember.status,
    };
  },

  async validateManagerPermission(groupId: number, userId: number) {
    const m = await GroupMember.findOne({ groupId, userId });
    if (!m) {
      throw new AppError(403, 'Bạn không thuộc group này');
    }
    if (m.role !== 'MANAGER' || m.status !== 'APPROVED') {
      throw new AppError(403, 'Bạn không có quyền duyệt thành viên');
    }
  },
};
