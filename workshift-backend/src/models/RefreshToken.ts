import mongoose from 'mongoose';

export interface IRefreshToken extends mongoose.Document {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const refreshTokenSchema = new mongoose.Schema<IRefreshToken>(
  {
    userId: { type: Number, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
