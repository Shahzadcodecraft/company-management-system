import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getSession, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// POST /api/user/password - Change user password
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const parsed = PasswordSchema.safeParse(body);
    
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const { currentPassword, newPassword } = parsed.data;

    await dbConnect();
    const userId = (session.user as any).id;
    
    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) return errorResponse('User not found', 404);

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return errorResponse('Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    return successResponse({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('POST /api/user/password error:', err);
    return errorResponse('Server error', 500);
  }
}
