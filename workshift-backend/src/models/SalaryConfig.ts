import mongoose from 'mongoose';

export interface ISalaryConfig extends mongoose.Document {
  id: number;
  groupId: number;
  /** Lương theo vị trí — mutually exclusive với userId */
  positionId?: number;
  /** Lương riêng user — mutually exclusive với positionId */
  userId?: number;
  hourlyRate: number;
  effectiveDate: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const salaryConfigSchema = new mongoose.Schema<ISalaryConfig>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    groupId: { type: Number, required: true, index: true },
    positionId: { type: Number },
    userId: { type: Number },
    hourlyRate: { type: Number, required: true, min: 0 },
    effectiveDate: { type: String, required: true, index: true },
  },
  { id: false, timestamps: true }
);

salaryConfigSchema.index({ groupId: 1, effectiveDate: -1 });

salaryConfigSchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const SalaryConfig = mongoose.model<ISalaryConfig>('SalaryConfig', salaryConfigSchema);
