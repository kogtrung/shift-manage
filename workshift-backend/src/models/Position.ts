import mongoose from 'mongoose';

export interface IPosition extends mongoose.Document {
  id: number;
  groupId: number;
  name: string;
  colorCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const positionSchema = new mongoose.Schema<IPosition>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    groupId: { type: Number, required: true, index: true },
    name: { type: String, required: true, maxlength: 255 },
    colorCode: { type: String, maxlength: 50 },
  },
  { id: false, timestamps: true }
);

positionSchema.index({ groupId: 1, name: 1 }, { unique: true });

positionSchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const Position = mongoose.model<IPosition>('Position', positionSchema);
