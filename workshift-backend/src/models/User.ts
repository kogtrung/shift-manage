import mongoose from 'mongoose';
import type { GlobalRole, UserStatus } from '../types/auth';

export interface IUser extends mongoose.Document {
  id: number;
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  status: UserStatus;
  globalRole: GlobalRole;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
  id: { type: Number, required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, maxlength: 255 },
  password: { type: String, required: true },
  fullName: { type: String, required: true, maxlength: 255 },
  phone: { type: String, maxlength: 30 },
  status: { type: String, enum: ['ACTIVE', 'BANNED'], default: 'ACTIVE' },
  globalRole: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  },
  { id: false, timestamps: true }
);

userSchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.password;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const User = mongoose.model<IUser>('User', userSchema);
