import { NextRequest } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Employee from '@/models/Employee';
import { getSession, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

const UpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['Admin', 'Manager', 'Employee']).optional(),
  department: z.string().optional(),
  salary: z.number().min(0).optional(),
  status: z.enum(['Active', 'Inactive', 'On Leave']).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  performance: z.number().min(0).max(100).optional(),
  joinDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const employee = await Employee.findById(params.id).populate('department', 'name').lean();
    if (!employee) return errorResponse('Employee not found', 404);

    return successResponse(employee);
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
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    await dbConnect();

    // Fix: Convert empty department string to undefined
    const data = { ...parsed.data };
    if (!data.department) delete (data as any).department;

    // Convert date strings to Date objects
    if (data.joinDate) data.joinDate = new Date(data.joinDate) as any;
    if (data.endDate) data.endDate = new Date(data.endDate) as any;

    const employee = await Employee.findByIdAndUpdate(params.id, data, { new: true, runValidators: true }).populate('department', 'name');
    if (!employee) return errorResponse('Employee not found', 404);

    return successResponse(employee);
  } catch (err: any) {
    console.error('PUT /api/employees error:', err);
    return errorResponse(err.message || 'Server error', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);
    if ((session.user as any).role !== 'Admin') return errorResponse('Forbidden', 403);

    await dbConnect();
    const employee = await Employee.findByIdAndDelete(params.id);
    if (!employee) return errorResponse('Employee not found', 404);

    return successResponse({ message: 'Employee deleted' });
  } catch (err) {
    return errorResponse('Server error', 500);
  }
}
