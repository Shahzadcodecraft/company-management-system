import { NextRequest } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import { getSession, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

const UpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  assignee: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  status: z.enum(['Todo', 'In Progress', 'Review', 'Done']).optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message, 422);

    await dbConnect();
    const task = await Task.findByIdAndUpdate(params.id, parsed.data, { new: true })
      .populate('assignee', 'name avatar email')
      .populate('project', 'title');

    if (!task) return errorResponse('Task not found', 404);
    return successResponse(task);
  } catch (err) {
    return errorResponse('Server error', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const task = await Task.findByIdAndDelete(params.id);
    if (!task) return errorResponse('Task not found', 404);
    return successResponse({ message: 'Task deleted' });
  } catch (err) {
    return errorResponse('Server error', 500);
  }
}
