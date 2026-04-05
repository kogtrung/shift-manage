import mongoose from 'mongoose';

export interface IShiftRequirement extends mongoose.Document {
  id: number;
  shiftId: number;
  positionId: number;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const shiftRequirementSchema = new mongoose.Schema<IShiftRequirement>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    shiftId: { type: Number, required: true, index: true },
    positionId: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { id: false, timestamps: true }
);

shiftRequirementSchema.index({ shiftId: 1, positionId: 1 }, { unique: true });

shiftRequirementSchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const ShiftRequirement = mongoose.model<IShiftRequirement>('ShiftRequirement', shiftRequirementSchema);
