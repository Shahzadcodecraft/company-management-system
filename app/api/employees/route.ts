import { NextRequest } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Employee from '@/models/Employee';
import Department from '@/models/Department';
import { getSession, successResponse, errorResponse, buildPaginationQuery } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

const EmployeeSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['Admin', 'Manager', 'Employee']),
  department: z.string().optional(),
  salary: z.number().min(0),
  status: z.enum(['Active', 'Inactive', 'On Leave']).default('Active'),
  phone: z.string().optional(),
  address: z.string().optional(),
  performance: z.number().min(0).max(100).optional().default(85),
  joinDate: z.string().optional(),
  endDate: z.string().optional(),
  avatar: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = buildPaginationQuery(searchParams);

    const query: Record<string, unknown> = {};
    const search = searchParams.get('search');
    const dept = searchParams.get('department');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (dept && dept !== 'All') {
      const department = await Department.findOne({ name: dept }).select('_id').lean();
      if (department) {
        query.department = department._id;
      }
    }
    if (role && role !== 'All') query.role = role;
    if (status && status !== 'All') query.status = status;

    const [employees, total] = await Promise.all([
      Employee.find(query)
        .populate('department', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(query),
    ]);

    return successResponse({ employees, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('GET /api/employees error:', err);
    return errorResponse('Server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);
    if ((session.user as any).role === 'Employee') return errorResponse('Forbidden', 403);

    const body = await req.json();

    const parsed = EmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    await dbConnect();
    const existing = await Employee.findOne({ email: parsed.data.email });
    if (existing) return errorResponse('Employee with this email already exists', 409);

    // Fix: Convert empty department string to undefined
    const data = { ...parsed.data };
    if (!data.department) delete (data as any).department;

    // Convert date strings to Date objects
    if (data.joinDate) data.joinDate = new Date(data.joinDate) as any;
    if (data.endDate) data.endDate = new Date(data.endDate) as any;

    // Generate avatar from initials
    if (!data.avatar) {
      data.avatar = data.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    }

    const employee = await Employee.create(data);
    return successResponse(employee, 201);
  } catch (err: any) {
    console.error('POST /api/employees error:', err);
    return errorResponse(err.message || 'Server error', 500);
  }
}
