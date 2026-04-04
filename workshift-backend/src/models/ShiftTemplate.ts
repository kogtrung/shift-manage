import mongoose from 'mongoose';

export interface IShiftTemplate extends mongoose.Document {
  id: number;
  groupId: number;
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const shiftTemplateSchema = new mongoose.Schema<IShiftTemplate>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    groupId: { type: Number, required: true, index: true },
    name: { type: String, required: true, maxlength: 255 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    description: { type: String, maxlength: 1000 },
  },
  { id: false, timestamps: true }
);

shiftTemplateSchema.index({ groupId: 1, name: 1 }, { unique: true });

shiftTemplateSchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const ShiftTemplate = mongoose.model<IShiftTemplate>('ShiftTemplate', shiftTemplateSchema);
