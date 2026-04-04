import mongoose from 'mongoose';
import type { GroupAuditActionType, GroupAuditActorRole, GroupAuditEntityType } from '../types/group';

export interface IGroupAuditLog extends mongoose.Document {
  id: number;
  groupId: number;
  actorUserId: number;
  actorRole: GroupAuditActorRole;
  actionType: GroupAuditActionType;
  entityType: GroupAuditEntityType;
  entityId: number;
  occurredAt: Date;
  summary: string;
  beforeData: string | null;
  afterData: string | null;
  metadata: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const groupAuditLogSchema = new mongoose.Schema<IGroupAuditLog>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    groupId: { type: Number, required: true, index: true },
    actorUserId: { type: Number, required: true, index: true },
    actorRole: { type: String, enum: ['MANAGER', 'MEMBER'], required: true },
    actionType: { type: String, required: true },
    entityType: { type: String, enum: ['GROUP', 'GROUP_MEMBER', 'REGISTRATION'], required: true },
    entityId: { type: Number, required: true },
    occurredAt: { type: Date, required: true, index: true },
    summary: { type: String, required: true },
    beforeData: { type: String, default: null },
    afterData: { type: String, default: null },
    metadata: { type: String, default: null },
  },
  { id: false, timestamps: true }
);

groupAuditLogSchema.index({ groupId: 1, occurredAt: -1 });

groupAuditLogSchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const GroupAuditLog = mongoose.model<IGroupAuditLog>('GroupAuditLog', groupAuditLogSchema);
