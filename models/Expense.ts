import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IExpense extends Document {
  description: string;
  category: string;
  amount: number;
  date: Date;
  status: 'Pending' | 'Approved' | 'Rejected';
  paymentStatus: 'Unpaid' | 'Paid' | 'Partially Paid';
  paymentMethod: 'Card' | 'Cash' | 'Bank Transfer' | 'Check' | 'Digital Wallet' | 'Other';
  paidAt?: Date;
  receiptNumber?: string;
  vendor?: string;
  department: string;
  submittedBy: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
  notes?: string;
  receiptImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ['Technology', 'Software', 'Marketing', 'HR', 'Operations', 'Training', 'Travel', 'Other'] },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    paymentStatus: { type: String, enum: ['Unpaid', 'Paid', 'Partially Paid'], default: 'Unpaid' },
    paymentMethod: { type: String, enum: ['Card', 'Cash', 'Bank Transfer', 'Check', 'Digital Wallet', 'Other'], default: 'Card' },
    paidAt: { type: Date },
    receiptNumber: { type: String, trim: true },
    vendor: { type: String, trim: true },
    department: { type: String, required: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    receiptImage: { type: String },
  },
  { timestamps: true, strict: true }
);

ExpenseSchema.index({ status: 1, date: -1 });

// Clear cached model to avoid schema issues in development
if (mongoose.models.Expense) {
  delete (mongoose.models as any).Expense;
}

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
