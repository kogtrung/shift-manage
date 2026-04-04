import mongoose from 'mongoose';
import type { GroupMemberStatus, GroupRole } from '../types/group';

export interface IGroupMember extends mongoose.Document {
  id: number;
  groupId: number;
  userId: number;
  role: GroupRole;
  status: GroupMemberStatus;
  joinedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const groupMemberSchema = new mongoose.Schema<IGroupMember>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    groupId: { type: Number, required: true, index: true },
    userId: { type: Number, required: true, index: true },
    role: { type: String, enum: ['MANAGER', 'MEMBER'], required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'BANNED'],
      required: true,
    },
    joinedAt: { type: Date, default: null },
  },
  { id: false, timestamps: true }
);

groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

groupMemberSchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const GroupMember = mongoose.model<IGroupMember>('GroupMember', groupMemberSchema);
