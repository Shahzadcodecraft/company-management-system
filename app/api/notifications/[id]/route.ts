import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { getSession, successResponse, errorResponse } from '@/lib/api-helpers';

// PATCH /api/notifications/[id] - Mark single notification as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const userId = (session.user as any).id;
    const { id } = params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) return errorResponse('Notification not found', 404);

    return successResponse(notification);
  } catch (err) {
    console.error('PATCH /api/notifications/[id] error:', err);
    return errorResponse('Server error', 500);
  }
}

// DELETE /api/notifications/[id] - Delete single notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const userId = (session.user as any).id;
    const { id } = params;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) return errorResponse('Notification not found', 404);

    return successResponse({ deleted: true });
  } catch (err) {
    console.error('DELETE /api/notifications/[id] error:', err);
    return errorResponse('Server error', 500);
  }
}
