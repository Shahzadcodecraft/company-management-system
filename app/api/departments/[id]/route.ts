import { NextRequest } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Department from '@/models/Department';
import { getSession, successResponse, errorResponse, buildPaginationQuery } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  head: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  budget: z.number().min(0).optional(),
  color: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);
    if ((session.user as any).role === 'Employee') return errorResponse('Forbidden', 403);

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message, 422);

    await dbConnect();
    const dept = await Department.findByIdAndUpdate(params.id, parsed.data, { new: true });
    if (!dept) return errorResponse('Department not found', 404);
    return successResponse(dept);
  } catch (err) {
    return errorResponse('Server error', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);
    if ((session.user as any).role !== 'Admin') return errorResponse('Forbidden', 403);

    await dbConnect();
    const dept = await Department.findByIdAndDelete(params.id);
    if (!dept) return errorResponse('Department not found', 404);
    return successResponse({ message: 'Department deleted' });
  } catch (err) {
    return errorResponse('Server error', 500);
  }
}
