import mongoose from 'mongoose';

export type ShiftChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IShiftChangeRequest extends mongoose.Document {
  id: number;
  groupId: number;
  userId: number;
  fromShiftId: number;
  toShiftId?: number | null;
  reason?: string;
  status: ShiftChangeRequestStatus;
  managerNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const shiftChangeRequestSchema = new mongoose.Schema<IShiftChangeRequest>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    groupId: { type: Number, required: true, index: true },
    userId: { type: Number, required: true, index: true },
    fromShiftId: { type: Number, required: true, index: true },
    toShiftId: { type: Number, default: null },
    reason: { type: String, maxlength: 1000 },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    managerNote: { type: String, maxlength: 1000 },
  },
  { id: false, timestamps: true }
);

shiftChangeRequestSchema.index({ groupId: 1, status: 1 });

shiftChangeRequestSchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const ShiftChangeRequest = mongoose.model<IShiftChangeRequest>(
  'ShiftChangeRequest',
  shiftChangeRequestSchema
);
