import mongoose from 'mongoose';
import type { RegistrationStatus } from '../types/shift';

export interface IRegistration extends mongoose.Document {
  id: number;
  shiftId: number;
  userId: number;
  positionId: number;
  status: RegistrationStatus;
  note?: string;
  managerNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const registrationSchema = new mongoose.Schema<IRegistration>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    shiftId: { type: Number, required: true, index: true },
    userId: { type: Number, required: true, index: true },
    positionId: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
    },
    note: { type: String, maxlength: 1000 },
    managerNote: { type: String, maxlength: 1000 },
  },
  { id: false, timestamps: true }
);

registrationSchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const Registration = mongoose.model<IRegistration>('Registration', registrationSchema);
