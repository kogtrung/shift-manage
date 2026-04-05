import { getNextSequence } from './sequenceService';
import { AdminAuditLog } from '../models/AdminAuditLog';
import type { AdminAuditActionType } from '../models/AdminAuditLog';

function toJson(input: unknown): string | null {
  if (input === undefined || input === null) return null;
  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}

export const adminAuditService = {
  async record(params: {
    actorUserId: number;
    actionType: AdminAuditActionType;
    targetType: 'USER' | 'GROUP';
    targetId: number;
    summary: string;
    beforeData: unknown;
    afterData: unknown;
  }) {
    const id = await getNextSequence('AdminAuditLog');
    await AdminAuditLog.create({
      id,
      actorUserId: params.actorUserId,
      actionType: params.actionType,
      targetType: params.targetType,
      targetId: params.targetId,
      summary: params.summary,
      beforeData: toJson(params.beforeData),
      afterData: toJson(params.afterData),
      occurredAt: new Date(),
    });
  },

  async listPaginated(page: number, size: number) {
    const filter: Record<string, unknown> = {};
    const totalElements = await AdminAuditLog.countDocuments(filter);
    const totalPages = Math.ceil(totalElements / size) || 0;
    const items = await AdminAuditLog.find(filter)
      .sort({ occurredAt: -1 })
      .skip(page * size)
      .limit(size)
      .lean();
    return {
      items: items.map((log) => ({
        id: log.id,
        actorUserId: log.actorUserId,
        actionType: log.actionType,
        targetType: log.targetType,
        targetId: log.targetId,
        summary: log.summary,
        beforeData: log.beforeData,
        afterData: log.afterData,
        occurredAt: log.occurredAt.toISOString(),
      })),
      page,
      size,
      totalElements,
      totalPages,
    };
  },
};
