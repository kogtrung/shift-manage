import mongoose from 'mongoose';
import type { GroupStatus } from '../types/group';

export interface IGroup extends mongoose.Document {
  id: number;
  name: string;
  description?: string;
  joinCode: string;
  createdByUserId: number;
  status: GroupStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const groupSchema = new mongoose.Schema<IGroup>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, maxlength: 255 },
    description: { type: String, maxlength: 1000 },
    joinCode: { type: String, required: true, unique: true, index: true, maxlength: 6 },
    createdByUserId: { type: Number, required: true, index: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { id: false, timestamps: true }
);

groupSchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const Group = mongoose.model<IGroup>('Group', groupSchema);
