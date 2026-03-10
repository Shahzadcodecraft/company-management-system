import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { getSession, successResponse, errorResponse, generateAppNotifications } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = (session.user as any).id;
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const generate = searchParams.get('generate') !== 'false'; // default true

    // Generate new notifications based on app state (if requested)
    if (generate) {
      await generateAppNotifications(userId);
    }

    const query: Record<string, unknown> = { userId };
    if (unreadOnly) query.read = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    return successResponse({ notifications, unreadCount });
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    return errorResponse('Server error', 500);
  }
}
