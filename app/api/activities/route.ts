import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import ActivityLog from '@/models/ActivityLog';
import { getSession, successResponse, errorResponse, buildPaginationQuery } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = buildPaginationQuery(searchParams);
    
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    const query: Record<string, unknown> = {};
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;

    const [activities, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    return successResponse({
      activities,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('GET /api/activities error:', err);
    return errorResponse('Server error', 500);
  }
}
