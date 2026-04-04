import { AppError } from '../common/appError';
import { GroupAuditLog } from '../models/GroupAuditLog';
import { GroupMember } from '../models/GroupMember';
import { User } from '../models/User';
import type {
  GroupAuditActionType,
  GroupAuditActorRole,
  GroupAuditEntityType,
} from '../types/group';
import { getNextSequence } from './sequenceService';
import { vnMonthRange, vnStartOfCalendarDay } from '../utils/vnTime';

const ALL_ACTION_TYPES: GroupAuditActionType[] = [
  'GROUP_CREATED',
  'GROUP_UPDATED',
  'GROUP_CLOSED',
  'GROUP_REOPENED',
  'GROUP_DELETE',
  'GROUP_DELETED',
  'GROUP_MEMBER_JOIN_REQUESTED',
  'GROUP_MEMBER_APPROVED',
  'GROUP_MEMBER_REJECTED',
  'REGISTRATION_CREATED',
  'REGISTRATION_APPROVED',
  'REGISTRATION_REJECTED',
  'REGISTRATION_CANCELLED',
];

function toJson(input: unknown): string | null {
  if (input === undefined || input === null) return null;
  if (typeof input === 'string') return input;
  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}

export const groupAuditService = {
  async recordEvent(params: {
    groupId: number;
    actorUserId: number;
    actorRole: GroupAuditActorRole;
    actionType: GroupAuditActionType;
    entityType: GroupAuditEntityType;
    entityId: number;
    summary: string;
    beforeData: unknown;
    afterData: unknown;
    metadata: Record<string, unknown> | null;
  }) {
    const id = await getNextSequence('GroupAuditLog');
    await GroupAuditLog.create({
      id,
      groupId: params.groupId,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      actionType: params.actionType,
      entityType: params.entityType,
      entityId: params.entityId,
      occurredAt: new Date(),
      summary: params.summary,
      beforeData: toJson(params.beforeData),
      afterData: toJson(params.afterData),
      metadata: params.metadata ? toJson(params.metadata) : null,
    });
  },

  async validateManager(groupId: number, userId: number) {
    const m = await GroupMember.findOne({ groupId, userId });
    if (!m) {
      throw new AppError(403, 'Bạn không thuộc group này');
    }
    if (m.role !== 'MANAGER' || m.status !== 'APPROVED') {
      throw new AppError(403, 'Bạn không có quyền xem audit của group');
    }
  },

  async getAuditLogs(
    username: string,
    groupId: number,
    query: {
      from?: string;
      to?: string;
      actionType?: GroupAuditActionType;
      actorUserId?: number;
      entityType?: GroupAuditEntityType;
      entityId?: number;
      page: number;
      size: number;
    }
  ) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await this.validateManager(groupId, user.id);

    if (query.page < 0) {
      throw new AppError(400, 'page phải >= 0');
    }
    if (query.size < 1 || query.size > 200) {
      throw new AppError(400, 'size phải nằm trong khoảng 1..200');
    }

    const filter: Record<string, unknown> = { groupId };
    const timeCond: Record<string, Date> = {};
    if (query.from) {
      timeCond.$gte = vnStartOfCalendarDay(query.from);
    }
    if (query.to) {
      const startTo = vnStartOfCalendarDay(query.to);
      timeCond.$lt = new Date(startTo.getTime() + 24 * 60 * 60 * 1000);
    }
    if (Object.keys(timeCond).length) {
      filter.occurredAt = timeCond;
    }
    if (query.actionType) filter.actionType = query.actionType;
    if (query.actorUserId != null) filter.actorUserId = query.actorUserId;
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId != null) filter.entityId = query.entityId;

    const totalElements = await GroupAuditLog.countDocuments(filter);
    const totalPages = Math.ceil(totalElements / query.size) || 0;
    const items = await GroupAuditLog.find(filter)
      .sort({ occurredAt: -1 })
      .skip(query.page * query.size)
      .limit(query.size)
      .lean();

    const actorIds = [...new Set(items.map((i) => i.actorUserId))];
    const actors = await User.find({ id: { $in: actorIds } }).lean();
    const actorMap = new Map(actors.map((a) => [a.id, a]));

    const mapped = items.map((log) => {
      const actor = actorMap.get(log.actorUserId);
      return {
        id: log.id,
        groupId: log.groupId,
        actorUserId: log.actorUserId,
        actorUsername: actor?.username ?? '',
        actorFullName: actor?.fullName ?? '',
        actorRole: log.actorRole,
        actionType: log.actionType,
        entityType: log.entityType,
        entityId: log.entityId,
        occurredAt: log.occurredAt.toISOString(),
        summary: log.summary,
        beforeData: log.beforeData,
        afterData: log.afterData,
        metadata: log.metadata,
      };
    });

    return {
      items: mapped,
      page: query.page,
      size: query.size,
      totalElements,
      totalPages,
    };
  },

  async getDailySummary(username: string, groupId: number, isoDate: string) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await this.validateManager(groupId, user.id);

    const start = vnStartOfCalendarDay(isoDate);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const logs = await GroupAuditLog.find({
      groupId,
      occurredAt: { $gte: start, $lt: end },
    }).lean();

    const byAction = ALL_ACTION_TYPES.map((actionType) => ({
      actionType,
      count: logs.filter((l) => l.actionType === actionType).length,
    })).filter((x) => x.count > 0);

    return {
      groupId,
      date: isoDate,
      totalEvents: logs.length,
      byAction,
    };
  },

  async getMonthlySummary(username: string, groupId: number, month: number, year: number) {
    if (month < 1 || month > 12) {
      throw new AppError(400, 'Tháng không hợp lệ');
    }
    if (year < 2000 || year > 2100) {
      throw new AppError(400, 'Năm không hợp lệ');
    }
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Không tìm thấy người dùng đăng nhập');
    }
    await this.validateManager(groupId, user.id);

    const { start, end } = vnMonthRange(year, month);
    const logs = await GroupAuditLog.find({
      groupId,
      occurredAt: { $gte: start, $lt: end },
    }).lean();

    const byAction = ALL_ACTION_TYPES.map((actionType) => ({
      actionType,
      count: logs.filter((l) => l.actionType === actionType).length,
    })).filter((x) => x.count > 0);

    return {
      groupId,
      month,
      year,
      totalEvents: logs.length,
      byAction,
    };
  },
};
