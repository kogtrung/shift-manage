import mongoose from 'mongoose';

export type AdminAuditActionType = 'USER_STATUS_TOGGLED' | 'GROUP_STATUS_TOGGLED';

export interface IAdminAuditLog extends mongoose.Document {
  id: number;
  actorUserId: number;
  actionType: AdminAuditActionType;
  targetType: 'USER' | 'GROUP';
  targetId: number;
  summary: string;
  beforeData: string | null;
  afterData: string | null;
  occurredAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const adminAuditLogSchema = new mongoose.Schema<IAdminAuditLog>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    actorUserId: { type: Number, required: true, index: true },
    actionType: { type: String, required: true, index: true },
    targetType: { type: String, enum: ['USER', 'GROUP'], required: true },
    targetId: { type: Number, required: true, index: true },
    summary: { type: String, required: true },
    beforeData: { type: String, default: null },
    afterData: { type: String, default: null },
    occurredAt: { type: Date, required: true, index: true },
  },
  { id: false, timestamps: true }
);

adminAuditLogSchema.index({ occurredAt: -1 });

adminAuditLogSchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const AdminAuditLog = mongoose.model<IAdminAuditLog>('AdminAuditLog', adminAuditLogSchema);
