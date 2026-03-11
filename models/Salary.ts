import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISalary extends Document {
  employee: Types.ObjectId;
  month: number; // 1-12
  year: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  totalAmount: number;
  paidAmount: number;
  status: 'Pending' | 'Partially Paid' | 'Paid';
  paymentMethod?: 'Bank Transfer' | 'Cash' | 'Check' | 'Digital Wallet';
  paidAt?: Date;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SalarySchema = new Schema<ISalary>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000 },
    baseSalary: { type: Number, required: true, min: 0 },
    bonus: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['Pending', 'Partially Paid', 'Paid'], default: 'Pending' },
    paymentMethod: { type: String, enum: ['Bank Transfer', 'Cash', 'Check', 'Digital Wallet'] },
    paidAt: { type: Date },
    transactionId: { type: String, trim: true },
    notes: { type: String },
  },
  { timestamps: true }
);

// Compound index to ensure one salary record per employee per month/year
SalarySchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
SalarySchema.index({ status: 1, month: 1, year: 1 });
SalarySchema.index({ year: -1, month: -1 });

export default mongoose.models.Salary || mongoose.model<ISalary>('Salary', SalarySchema);
