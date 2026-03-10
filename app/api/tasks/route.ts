import { NextRequest } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import { getSession, successResponse, errorResponse } from '@/lib/api-helpers';

const TaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().default(''),
  project: z.string(),
  assignee: z.string(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  status: z.enum(['Todo', 'In Progress', 'Review', 'Done']).default('Todo'),
  dueDate: z.string(),
  tags: z.array(z.string()).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project');
    const assigneeId = searchParams.get('assignee');
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (projectId) query.project = projectId;
    if (assigneeId) query.assignee = assigneeId;
    if (status && status !== 'All') query.status = status;

    const tasks = await Task.find(query)
      .populate('assignee', 'name avatar email')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(tasks);
  } catch (err) {
    return errorResponse('Server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const parsed = TaskSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message, 422);

    await dbConnect();
    const task = await Task.create({
      ...parsed.data,
      createdBy: (session.user as any).id,
    });

    const populated = await task.populate([
      { path: 'assignee', select: 'name avatar email' },
      { path: 'project', select: 'title' },
    ]);

    return successResponse(populated, 201);
  } catch (err) {
    return errorResponse('Server error', 500);
  }
}
