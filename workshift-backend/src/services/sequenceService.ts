import { Counter } from '../models/Counter';

export async function getNextSequence(name: string): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  if (!doc?.seq) {
    throw new Error(`Sequence "${name}" failed`);
  }
  return doc.seq;
}
