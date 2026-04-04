import mongoose from 'mongoose';

export interface ITemplateRequirement extends mongoose.Document {
  id: number;
  templateId: number;
  positionId: number;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const templateRequirementSchema = new mongoose.Schema<ITemplateRequirement>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    templateId: { type: Number, required: true, index: true },
    positionId: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { id: false, timestamps: true }
);

templateRequirementSchema.set('toJSON', {
  transform(_doc, ret) {
    const out = { ...ret } as Record<string, unknown>;
    delete out.__v;
    delete out._id;
    return out;
  },
});

export const TemplateRequirement = mongoose.model<ITemplateRequirement>(
  'TemplateRequirement',
  templateRequirementSchema
);
