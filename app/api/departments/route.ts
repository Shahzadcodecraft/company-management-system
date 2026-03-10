import { NextRequest } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Department from '@/models/Department';
import Employee from '@/models/Employee';
import { getSession, successResponse, errorResponse } from '@/lib/api-helpers';

const DeptSchema = z.object({
  name: z.string().min(1).max(100),
  head: z.string().min(1).max(100),
  description: z.string().optional().default(''),
  budget: z.number().min(0).optional().default(0),
  color: z.string().optional().default('#4F8EF7'),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    
    // Parse pagination params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Department.countDocuments();
    
    const departments = await Department.find().sort({ name: 1 }).skip(skip).limit(limit).lean();

    // Attach employee count
    const deptWithCount = await Promise.all(
      departments.map(async (d) => {
        const count = await Employee.countDocuments({ department: d._id, status: 'Active' });
        return { ...d, employeeCount: count };
      })
    );

    return successResponse({
      departments: deptWithCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('GET /api/departments error:', err);
    return errorResponse('Server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);
    if ((session.user as any).role !== 'Admin') return errorResponse('Forbidden', 403);

    const body = await req.json();
    const parsed = DeptSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message, 422);

    await dbConnect();
    const existing = await Department.findOne({ name: parsed.data.name });
    if (existing) return errorResponse('Department already exists', 409);

    const dept = await Department.create(parsed.data);
    return successResponse(dept, 201);
  } catch (err) {
    return errorResponse('Server error', 500);
  }
}
