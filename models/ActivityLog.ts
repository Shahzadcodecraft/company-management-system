import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivityLog extends Document {
  entityType: 'Project' | 'Task' | 'Employee' | 'Department' | 'Expense';
  entityId: Types.ObjectId;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'assigned' | 'commented' | 'budget_updated' | 'progress_updated';
  performedBy: Types.ObjectId;
  performedByName: string;
  details: {
    field?: string;
    oldValue?: any;
    newValue?: any;
    message?: string;
  };
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    entityType: {
      type: String,
      enum: ['Project', 'Task', 'Employee', 'Department', 'Expense'],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted', 'status_changed', 'assigned', 'commented', 'budget_updated', 'progress_updated'],
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByName: {
      type: String,
      required: true,
    },
    details: {
      field: String,
      oldValue: Schema.Types.Mixed,
      newValue: Schema.Types.Mixed,
      message: String,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
ActivityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
ActivityLogSchema.index({ performedBy: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 });

export default mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
