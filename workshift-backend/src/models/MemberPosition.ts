import mongoose from 'mongoose';

/** Vị trí member được phép làm trong một group (B19 / MemberPosition). */
export interface IMemberPosition extends mongoose.Document {
  id: number;
  userId: number;
  groupId: number;
  positionId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const memberPositionSchema = new mongoose.Schema<IMemberPosition>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    groupId: { type: Number, required: true, index: true },
    positionId: { type: Number, required: true },
  },
  { id: false, timestamps: true }
);

memberPositionSchema.index({ userId: 1, groupId: 1, positionId: 1 }, { unique: true });

memberPositionSchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const MemberPosition = mongoose.model<IMemberPosition>('MemberPosition', memberPositionSchema);
