import { NextRequest } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import { getSession, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

const UpdateSchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Rejected']).optional(),
  notes: z.string().optional(),
  description: z.string().optional(),
  amount: z.number().min(0).optional(),
  receiptImage: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message, 422);

    // Only Admin/Manager can approve/reject
    if (parsed.data.status && (session.user as any).role === 'Employee') {
      return errorResponse('Forbidden', 403);
    }

    await dbConnect();
    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status) {
      updateData.reviewedBy = (session.user as any).id;
    }

    const expense = await Expense.findByIdAndUpdate(params.id, updateData, { new: true });
    if (!expense) return errorResponse('Expense not found', 404);
    return successResponse(expense);
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
    await Expense.findByIdAndDelete(params.id);
    return successResponse({ message: 'Expense deleted' });
  } catch (err) {
    return errorResponse('Server error', 500);
  }
}
