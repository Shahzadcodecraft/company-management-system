import { NextRequest } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Salary from '@/models/Salary';
import { getSession, successResponse, errorResponse } from '@/lib/api-helpers';

const UpdateSalarySchema = z.object({
  baseSalary: z.number().min(0).optional(),
  bonus: z.number().min(0).optional(),
  deductions: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  status: z.enum(['Pending', 'Partially Paid', 'Paid']).optional(),
  paymentMethod: z.enum(['Bank Transfer', 'Cash', 'Check', 'Digital Wallet']).optional(),
  paidAt: z.string().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

// Calculate status based on paidAmount vs totalAmount
function calculateStatus(paidAmount: number, totalAmount: number): 'Pending' | 'Partially Paid' | 'Paid' {
  if (paidAmount >= totalAmount) return 'Paid';
  if (paidAmount > 0) return 'Partially Paid';
  return 'Pending';
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    
    const salary = await Salary.findById(params.id)
      .populate('employee', 'name email department role avatar')
      .lean();

    if (!salary) {
      return errorResponse('Salary record not found', 404);
    }

    return successResponse(salary);
  } catch (err) {
    console.error('GET salary error:', err);
    return errorResponse('Server error', 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    
    const parsed = UpdateSalarySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    await dbConnect();

    const existingSalary = await Salary.findById(params.id);
    if (!existingSalary) {
      return errorResponse('Salary record not found', 404);
    }

    // Build update data
    const updateData: any = { ...parsed.data };
    
    // Recalculate totalAmount if baseSalary, bonus, or deductions changed
    if (parsed.data.baseSalary !== undefined || parsed.data.bonus !== undefined || parsed.data.deductions !== undefined) {
      const baseSalary = parsed.data.baseSalary ?? existingSalary.baseSalary;
      const bonus = parsed.data.bonus ?? existingSalary.bonus;
      const deductions = parsed.data.deductions ?? existingSalary.deductions;
      updateData.totalAmount = baseSalary + bonus - deductions;
    }

    // Recalculate status if paidAmount changed or totalAmount was recalculated
    if (parsed.data.paidAmount !== undefined || updateData.totalAmount !== undefined) {
      const paidAmount = parsed.data.paidAmount ?? existingSalary.paidAmount;
      const totalAmount = updateData.totalAmount ?? existingSalary.totalAmount;
      updateData.status = calculateStatus(paidAmount, totalAmount);
    }

    // Handle paidAt date
    if (parsed.data.paidAt) {
      updateData.paidAt = new Date(parsed.data.paidAt);
    }

    const salary = await Salary.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    ).populate('employee', 'name email department role avatar');

    return successResponse(salary);
  } catch (err) {
    console.error('PUT salary error:', err);
    return errorResponse('Server error', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();

    const salary = await Salary.findByIdAndDelete(params.id);
    if (!salary) {
      return errorResponse('Salary record not found', 404);
    }

    return successResponse({ message: 'Salary record deleted' });
  } catch (err) {
    console.error('DELETE salary error:', err);
    return errorResponse('Server error', 500);
  }
}
