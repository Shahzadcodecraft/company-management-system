import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'budget_alert' | 'employee_joined' | 'task_completed' | 'task_assigned' | 'expense_pending' | 'project_created' | 'project_completed' | 'deadline_approaching';
  title: string;
  message: string;
  entityType?: 'Project' | 'Task' | 'Employee' | 'Expense' | 'Department';
  entityId?: Types.ObjectId;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['budget_alert', 'employee_joined', 'task_completed', 'task_assigned', 'expense_pending', 'project_created', 'project_completed', 'deadline_approaching'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: ['Project', 'Task', 'Employee', 'Expense', 'Department'],
    },
    entityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
