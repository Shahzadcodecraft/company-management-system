import { NextRequest } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { getSession, successResponse, errorResponse, logActivity } from '@/lib/api-helpers';

const UpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['Planning', 'In Progress', 'Review', 'Completed', 'On Hold']).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  budget: z.number().min(0).optional(),
  progress: z.number().min(0).max(100).optional(),
  spent: z.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  team: z.array(z.string()).optional(),
  department: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const project = await Project.findById(params.id)
      .populate('team', 'name avatar email role')
      .populate('department', 'name')
      .lean();

    if (!project) return errorResponse('Project not found', 404);
    return successResponse(project);
  } catch (err) {
    return errorResponse('Server error', 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);
    if ((session.user as any).role === 'Employee') return errorResponse('Forbidden', 403);

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message, 422);

    await dbConnect();
    const oldProject = await Project.findById(params.id).lean();
    if (!oldProject) return errorResponse('Project not found', 404);

    const project = await Project.findByIdAndUpdate(params.id, parsed.data, { new: true })
      .populate('team', 'name avatar email')
      .populate('department', 'name');

    if (!project) return errorResponse('Project not found', 404);

    // Log activities for changed fields
    const userId = (session.user as any).id;
    const userName = (session.user as any).name || 'Unknown';

    if (parsed.data.status && parsed.data.status !== oldProject.status) {
      await logActivity({
        entityType: 'Project',
        entityId: params.id,
        action: 'status_changed',
        performedBy: userId,
        performedByName: userName,
        details: {
          field: 'status',
          oldValue: oldProject.status,
          newValue: parsed.data.status,
          message: `Status changed from "${oldProject.status}" to "${parsed.data.status}"`,
        },
      });
    }

    if (parsed.data.budget !== undefined && parsed.data.budget !== oldProject.budget) {
      await logActivity({
        entityType: 'Project',
        entityId: params.id,
        action: 'budget_updated',
        performedBy: userId,
        performedByName: userName,
        details: {
          field: 'budget',
          oldValue: oldProject.budget,
          newValue: parsed.data.budget,
          message: `Budget updated from $${oldProject.budget?.toLocaleString()} to $${parsed.data.budget?.toLocaleString()}`,
        },
      });
    }

    if (parsed.data.progress !== undefined && parsed.data.progress !== oldProject.progress) {
      await logActivity({
        entityType: 'Project',
        entityId: params.id,
        action: 'progress_updated',
        performedBy: userId,
        performedByName: userName,
        details: {
          field: 'progress',
          oldValue: oldProject.progress,
          newValue: parsed.data.progress,
          message: `Progress updated from ${oldProject.progress || 0}% to ${parsed.data.progress}%`,
        },
      });
    }

    if (parsed.data.spent !== undefined && parsed.data.spent !== oldProject.spent) {
      await logActivity({
        entityType: 'Project',
        entityId: params.id,
        action: 'budget_updated',
        performedBy: userId,
        performedByName: userName,
        details: {
          field: 'spent',
          oldValue: oldProject.spent,
          newValue: parsed.data.spent,
          message: `Spending updated from $${(oldProject.spent || 0).toLocaleString()} to $${parsed.data.spent.toLocaleString()}`,
        },
      });
    }

    // Log general update if no specific field tracked
    if (!parsed.data.status && parsed.data.budget === undefined && parsed.data.progress === undefined && parsed.data.spent === undefined) {
      await logActivity({
        entityType: 'Project',
        entityId: params.id,
        action: 'updated',
        performedBy: userId,
        performedByName: userName,
        details: {
          message: `Updated project "${project.title}"`,
        },
      });
    }

    return successResponse(project);
  } catch (err) {
    console.error('PUT /api/projects error:', err);
    return errorResponse('Server error', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);
    if ((session.user as any).role !== 'Admin') return errorResponse('Forbidden', 403);

    await dbConnect();
    const project = await Project.findByIdAndDelete(params.id);
    if (!project) return errorResponse('Project not found', 404);

    // Log activity
    await logActivity({
      entityType: 'Project',
      entityId: params.id,
      action: 'deleted',
      performedBy: (session.user as any).id,
      performedByName: (session.user as any).name || 'Unknown',
      details: {
        message: `Deleted project "${project.title}"`,
      },
    });

    return successResponse({ message: 'Project deleted' });
  } catch (err) {
    return errorResponse('Server error', 500);
  }
}
