import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  head: string;
  description: string;
  budget: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    head: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    budget: { type: Number, default: 0, min: 0 },
    color: { type: String, default: '#4F8EF7' },
  },
  { timestamps: true }
);

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
