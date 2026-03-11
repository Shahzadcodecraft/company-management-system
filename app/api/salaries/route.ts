import { NextRequest } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import Salary from '@/models/Salary';
import Employee from '@/models/Employee';
import { getSession, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

const SalarySchema = z.object({
  employee: z.string().min(1),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  baseSalary: z.number().min(0),
  bonus: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  paidAmount: z.number().min(0).default(0),
  status: z.enum(['Pending', 'Partially Paid', 'Paid']).default('Pending'),
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

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const { searchParams } = new URL(req.url);
    
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const employee = searchParams.get('employee');

    const query: Record<string, unknown> = {};
    
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status && status !== 'All') query.status = status;
    if (employee) query.employee = employee;

    const salaries = await Salary.find(query)
      .populate('employee', 'name email department role avatar')
      .sort({ year: -1, month: -1, createdAt: -1 })
      .lean();

    return successResponse(salaries);
  } catch (err) {
    console.error('GET salaries error:', err);
    return errorResponse('Server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    
    const parsed = SalarySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    await dbConnect();

    // Verify employee exists
    const employee = await Employee.findById(parsed.data.employee);
    if (!employee) {
      return errorResponse('Employee not found', 404);
    }

    // Check if salary record already exists for this employee/month/year
    const existing = await Salary.findOne({
      employee: parsed.data.employee,
      month: parsed.data.month,
      year: parsed.data.year,
    });

    if (existing) {
      return errorResponse('Salary record already exists for this employee, month and year', 409);
    }

    // Calculate status based on paidAmount
    const status = calculateStatus(parsed.data.paidAmount, parsed.data.totalAmount);

    const salaryData = {
      ...parsed.data,
      status,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : undefined,
    };

    const salary = await Salary.create(salaryData);
    
    const populatedSalary = await Salary.findById(salary._id)
      .populate('employee', 'name email department role avatar')
      .lean();

    return successResponse(populatedSalary, 201);
  } catch (err: any) {
    console.error('POST salary error:', err);
    if (err.code === 11000) {
      return errorResponse('Salary record already exists for this employee, month and year', 409);
    }
    return errorResponse('Server error', 500);
  }
}
