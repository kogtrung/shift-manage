import { AppError } from '../common/appError';
import { Group } from '../models/Group';
import { User } from '../models/User';
import { adminAuditService } from './adminAuditService';
import { vnStartOfCalendarDay, vnTodayIsoDate } from '../utils/vnTime';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function userListDto(u: {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  status: string;
  globalRole: string;
  createdAt?: Date;
}) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone ?? null,
    status: u.status,
    globalRole: u.globalRole,
    createdAt: u.createdAt?.toISOString() ?? null,
  };
}

function groupListDto(g: {
  id: number;
  name: string;
  joinCode: string;
  createdByUserId: number;
  status: string;
  createdAt?: Date;
}) {
  return {
    id: g.id,
    name: g.name,
    joinCode: g.joinCode,
    createdByUserId: g.createdByUserId,
    status: g.status,
    createdAt: g.createdAt?.toISOString() ?? null,
  };
}

export const adminService = {
  async listUsers(
    page: number,
    size: number,
    search?: string
  ): Promise<{
    items: ReturnType<typeof userListDto>[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  }> {
    const filter: Record<string, unknown> = {};
    if (search?.trim()) {
      const q = escapeRegex(search.trim());
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
      ];
    }
    const totalElements = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalElements / size) || 0;
    const rows = await User.find(filter)
      .sort({ id: -1 })
      .skip(page * size)
      .limit(size)
      .lean();
    return {
      items: rows.map((u) => userListDto(u)),
      page,
      size,
      totalElements,
      totalPages,
    };
  },

  async toggleUserStatus(actorUserId: number, targetUserId: number) {
    if (actorUserId === targetUserId) {
      throw new AppError(400, 'Không thể đổi trạng thái tài khoản của chính bạn');
    }
    const target = await User.findOne({ id: targetUserId });
    if (!target) {
      throw new AppError(404, 'Không tìm thấy người dùng');
    }
    const prev = target.status;
    const next = prev === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    target.status = next;
    await target.save();

    await adminAuditService.record({
      actorUserId,
      actionType: 'USER_STATUS_TOGGLED',
      targetType: 'USER',
      targetId: targetUserId,
      summary: next === 'BANNED' ? 'Khóa tài khoản người dùng' : 'Mở khóa tài khoản người dùng',
      beforeData: { status: prev },
      afterData: { status: next },
    });

    return userListDto({
      id: target.id,
      username: target.username,
      email: target.email,
      fullName: target.fullName,
      phone: target.phone,
      status: target.status,
      globalRole: target.globalRole,
      createdAt: target.createdAt,
    });
  },

  async listGroups(
    page: number,
    size: number,
    search?: string
  ): Promise<{
    items: ReturnType<typeof groupListDto>[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  }> {
    const filter: Record<string, unknown> = {};
    if (search?.trim()) {
      const q = escapeRegex(search.trim());
      filter.name = { $regex: q, $options: 'i' };
    }
    const totalElements = await Group.countDocuments(filter);
    const totalPages = Math.ceil(totalElements / size) || 0;
    const rows = await Group.find(filter)
      .sort({ id: -1 })
      .skip(page * size)
      .limit(size)
      .lean();
    return {
      items: rows.map((g) => groupListDto(g)),
      page,
      size,
      totalElements,
      totalPages,
    };
  },

  async toggleGroupStatus(actorUserId: number, groupId: number) {
    const group = await Group.findOne({ id: groupId });
    if (!group) {
      throw new AppError(404, 'Không tìm thấy nhóm');
    }
    const prev = group.status;
    const next = prev === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    group.status = next;
    await group.save();

    await adminAuditService.record({
      actorUserId,
      actionType: 'GROUP_STATUS_TOGGLED',
      targetType: 'GROUP',
      targetId: groupId,
      summary: next === 'INACTIVE' ? 'Đóng nhóm (admin)' : 'Mở lại nhóm (admin)',
      beforeData: { status: prev },
      afterData: { status: next },
    });

    return groupListDto({
      id: group.id,
      name: group.name,
      joinCode: group.joinCode,
      createdByUserId: group.createdByUserId,
      status: group.status,
      createdAt: group.createdAt,
    });
  },

  async getMetrics() {
    const [usersTotal, usersActive, usersBanned, groupsTotal, groupsActive, groupsInactive] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: 'ACTIVE' }),
        User.countDocuments({ status: 'BANNED' }),
        Group.countDocuments(),
        Group.countDocuments({ status: 'ACTIVE' }),
        Group.countDocuments({ status: 'INACTIVE' }),
      ]);

    const iso = vnTodayIsoDate();
    const dayStart = vnStartOfCalendarDay(iso);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const [usersCreatedToday, groupsCreatedToday] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: dayStart, $lt: dayEnd } }),
      Group.countDocuments({ createdAt: { $gte: dayStart, $lt: dayEnd } }),
    ]);

    return {
      users: {
        total: usersTotal,
        active: usersActive,
        banned: usersBanned,
        createdToday: usersCreatedToday,
      },
      groups: {
        total: groupsTotal,
        active: groupsActive,
        inactive: groupsInactive,
        createdToday: groupsCreatedToday,
      },
      asOf: dayStart.toISOString(),
    };
  },
};
