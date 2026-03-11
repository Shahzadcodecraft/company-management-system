import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInvestor extends Document {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  investmentAmount: number;           // Amount received from investor
  investmentDate: Date;               // Date investment was received
  investmentType: 'Equity' | 'Loan' | 'Convertible Note' | 'Grant' | 'Other';  // Type of investment
  returnTerms?: string;               // Interest rate, equity %, repayment terms
  paymentMethod?: 'Bank Transfer' | 'Cash' | 'Check' | 'Digital Wallet' | 'Other';
  investmentPurpose?: string;         // What the investment is for
  image?: string;                     // Investor photo/image (base64)
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InvestorSchema = new Schema<IInvestor>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    investmentAmount: { type: Number, required: true, min: 0, default: 0 },
    investmentDate: { type: Date, required: true, default: Date.now },
    investmentType: { 
      type: String, 
      required: true, 
      enum: ['Equity', 'Loan', 'Convertible Note', 'Grant', 'Other'],
      default: 'Other'
    },
    returnTerms: { type: String },
    paymentMethod: { 
      type: String, 
      enum: ['Bank Transfer', 'Cash', 'Check', 'Digital Wallet', 'Other']
    },
    investmentPurpose: { type: String },
    image: { type: String },              // Base64 encoded image
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Virtual for remaining amount
InvestorSchema.virtual('remainingAdvanceAmount').get(function() {
  return this.totalAdvanceAmount - this.usedAdvanceAmount;
});

// Index for faster queries
InvestorSchema.index({ isActive: 1 });
InvestorSchema.index({ name: 1 });
InvestorSchema.index({ investmentDate: -1 });

// Clear cached model to avoid schema issues in development
if (mongoose.models.Investor) {
  delete (mongoose.models as any).Investor;
}

export default mongoose.model<IInvestor>('Investor', InvestorSchema);
