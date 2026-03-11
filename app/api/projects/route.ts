import { NextRequest } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import Department from '@/models/Department';
import Employee from '@/models/Employee';
import { getSession, successResponse, errorResponse, buildPaginationQuery, logActivity } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

const ProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().default(''),
  department: z.string().optional(),
  status: z.enum(['Planning', 'In Progress', 'Review', 'Completed', 'On Hold']).default('Planning'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  budget: z.number().min(0).default(0),
  spent: z.number().min(0).default(0),
  revenue: z.number().min(0).default(0),
  progress: z.number().min(0).max(100).default(0),
  startDate: z.string(),
  endDate: z.string(),
  team: z.array(z.string()).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const { skip, limit, page } = buildPaginationQuery(searchParams);
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (status && status !== 'All') query.status = status;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('team', 'name avatar email')
        .populate('department', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query),
    ]);

    // Ensure revenue field exists on all projects (for old documents)
    const projectsWithRevenue = projects.map(p => ({
      ...p,
      revenue: p.revenue ?? 0,
    }));

    console.log('GET /api/projects - First project revenue:', projects[0]?.revenue);

    return successResponse({ projects: projectsWithRevenue, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('GET /api/projects error:', err);
    return errorResponse('Server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);
    if ((session.user as any).role === 'Employee') return errorResponse('Forbidden', 403);

    const body = await req.json();
    const parsed = ProjectSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message, 422);

    await dbConnect();
    const project = await Project.create({
      ...parsed.data,
      createdBy: (session.user as any).id,
    });

    // Log activity
    await logActivity({
      entityType: 'Project',
      entityId: project._id.toString(),
      action: 'created',
      performedBy: (session.user as any).id,
      performedByName: (session.user as any).name || 'Unknown',
      details: {
        message: `Created project "${project.title}"`,
      },
    });

    return successResponse(project, 201);
  } catch (err) {
    return errorResponse('Server error', 500);
  }
}
