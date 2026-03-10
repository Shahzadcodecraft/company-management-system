import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { getSession, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

// POST /api/notifications/bulk - Bulk operations
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const userId = (session.user as any).id;
    const { action } = await req.json();

    if (action === 'markAllRead') {
      await Notification.updateMany(
        { userId, read: false },
        { read: true }
      );
      return successResponse({ markedRead: true });
    }

    if (action === 'clearAll') {
      await Notification.deleteMany({ userId });
      return successResponse({ cleared: true });
    }

    return errorResponse('Invalid action', 400);
  } catch (err) {
    console.error('POST /api/notifications/bulk error:', err);
    return errorResponse('Server error', 500);
  }
}
