import mongoose from 'mongoose';

export interface IAvailability extends mongoose.Document {
  id: number;
  userId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const availabilitySchema = new mongoose.Schema<IAvailability>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    userId: { type: Number, required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 1, max: 7 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { id: false, timestamps: true }
);

availabilitySchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const Availability = mongoose.model<IAvailability>('Availability', availabilitySchema);
