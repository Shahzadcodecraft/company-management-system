import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description: string;
  department: Types.ObjectId | string;
  status: 'Planning' | 'In Progress' | 'Review' | 'Completed' | 'On Hold';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  budget: number;
  spent: number;
  progress: number;
  startDate: Date;
  endDate: Date;
  team: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    status: { type: String, enum: ['Planning', 'In Progress', 'Review', 'Completed', 'On Hold'], default: 'Planning' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    budget: { type: Number, default: 0, min: 0 },
    spent: { type: Number, default: 0, min: 0 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    team: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ProjectSchema.index({ status: 1, priority: 1 });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
