import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Manager' | 'Employee';
  avatar: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  settings?: {
    companyName?: string;
    timezone?: string;
    currency?: string;
    notifications?: boolean;
    emailAlerts?: boolean;
    twoFA?: boolean;
    auditLog?: boolean;
    sessionTimeout?: string;
  };
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false, minlength: 6 },
    role: { type: String, enum: ['Admin', 'Manager', 'Employee'], default: 'Employee' },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    settings: {
      companyName: { type: String, default: 'NexusCorp Inc.' },
      timezone: { type: String, default: 'UTC-5' },
      currency: { type: String, default: 'PKR' },
      notifications: { type: Boolean, default: true },
      emailAlerts: { type: Boolean, default: true },
      twoFA: { type: Boolean, default: false },
      auditLog: { type: Boolean, default: true },
      sessionTimeout: { type: String, default: '30 minutes' },
    },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
