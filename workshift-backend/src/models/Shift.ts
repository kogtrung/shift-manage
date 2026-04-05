import mongoose from 'mongoose';
import type { ShiftStatus } from '../types/shift';

export interface IShift extends mongoose.Document {
  id: number;
  groupId: number;
  templateId?: number;
  name?: string;
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
  status: ShiftStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const shiftSchema = new mongoose.Schema<IShift>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    groupId: { type: Number, required: true, index: true },
    templateId: { type: Number },
    name: { type: String, maxlength: 255 },
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    note: { type: String, maxlength: 1000 },
    status: { type: String, enum: ['OPEN', 'LOCKED', 'COMPLETED'], default: 'OPEN' },
  },
  { id: false, timestamps: true }
);

shiftSchema.index({ groupId: 1, date: 1 });

shiftSchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const Shift = mongoose.model<IShift>('Shift', shiftSchema);
