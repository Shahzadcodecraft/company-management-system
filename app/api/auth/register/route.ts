import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(['Admin', 'Manager', 'Employee']).optional().default('Employee'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const { name, email, password, role } = parsed.data;

    await dbConnect();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return errorResponse('An account with this email already exists', 409);
    }

    // Hash password and generate avatar
    const hashedPassword = await bcrypt.hash(password, 12);
    const avatar = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    const user = await User.create({ name, email, password: hashedPassword, role, avatar });

    return successResponse(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      201
    );
  } catch (err: any) {
    console.error('Register error:', err);
    return errorResponse('Server error', 500);
  }
}
