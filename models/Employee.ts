import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEmployee extends Document {
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Employee';
  department: Types.ObjectId | string;
  salary: number;
  status: 'Active' | 'Inactive' | 'On Leave';
  joinDate: Date;
  endDate?: Date;
  avatar: string;
  phone?: string;
  address?: string;
  performance: number;
  userId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['Admin', 'Manager', 'Employee'], default: 'Employee' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    salary: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
    joinDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    avatar: { type: String },
    phone: { type: String },
    address: { type: String },
    performance: { type: Number, default: 85, min: 0, max: 100 },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

EmployeeSchema.index({ name: 'text', email: 'text' });
EmployeeSchema.index({ department: 1, status: 1 });

export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
