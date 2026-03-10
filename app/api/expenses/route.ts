import { NextRequest } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import { getSession, successResponse, errorResponse } from '@/lib/api-helpers';

const ExpenseSchema = z.object({
  description: z.string().min(1).max(500),
  category: z.enum(['Technology', 'Software', 'Marketing', 'HR', 'Operations', 'Training', 'Travel', 'Other']),
  amount: z.number().min(0),
  date: z.string(),
  department: z.string(),
  notes: z.string().optional(),
  paymentStatus: z.enum(['Unpaid', 'Paid', 'Partially Paid']).optional(),
  paymentMethod: z.enum(['Card', 'Cash', 'Bank Transfer', 'Check', 'Digital Wallet', 'Other']).optional(),
  paidAt: z.string().optional(),
  receiptNumber: z.string().optional(),
  vendor: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (status && status !== 'All') query.status = status;

    // Employees only see their own expenses
    if ((session.user as any).role === 'Employee') {
      query.submittedBy = (session.user as any).id;
    }

    const expenses = await Expense.find(query)
      .populate('submittedBy', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(expenses);
  } catch (err) {
    return errorResponse('Server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    
    const parsed = ExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    await dbConnect();
    
    // Build expense data with proper types
    const expenseData: any = {
      description: parsed.data.description,
      category: parsed.data.category,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      department: parsed.data.department,
      submittedBy: (session.user as any).id,
    };
    
    // Add payment fields
    if (parsed.data.paymentStatus) expenseData.paymentStatus = parsed.data.paymentStatus;
    if (parsed.data.paymentMethod) expenseData.paymentMethod = parsed.data.paymentMethod;
    if (parsed.data.paidAt) expenseData.paidAt = new Date(parsed.data.paidAt);
    if (parsed.data.receiptNumber) expenseData.receiptNumber = parsed.data.receiptNumber;
    if (parsed.data.vendor) expenseData.vendor = parsed.data.vendor;
    if (parsed.data.notes) expenseData.notes = parsed.data.notes;
    
    const expense = await Expense.create(expenseData);

    return successResponse(expense, 201);
  } catch (err) {
    return errorResponse('Server error', 500);
  }
}
