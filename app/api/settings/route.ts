import { NextRequest } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getSession, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

const SettingsSchema = z.object({
  companyName: z.string().min(1).max(100).optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  notifications: z.boolean().optional(),
  emailAlerts: z.boolean().optional(),
  twoFA: z.boolean().optional(),
  auditLog: z.boolean().optional(),
  sessionTimeout: z.string().optional(),
});

const ProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

// GET /api/settings - Get current user's settings
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();
    const user = await User.findById((session.user as any).id).select('name email role avatar settings').lean();
    
    if (!user) return errorResponse('User not found', 404);

    return successResponse({
      profile: {
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      settings: user.settings || {
        companyName: 'NexusCorp Inc.',
        timezone: 'UTC-5',
        currency: 'PKR',
        notifications: true,
        emailAlerts: true,
        twoFA: false,
        auditLog: true,
        sessionTimeout: '30 minutes',
      },
    });
  } catch (err) {
    console.error('GET /api/settings error:', err);
    return errorResponse('Server error', 500);
  }
}

// PUT /api/settings - Update user settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { profile, settings } = body;

    await dbConnect();
    const userId = (session.user as any).id;

    // Validate and update profile if provided
    if (profile) {
      const parsedProfile = ProfileSchema.safeParse(profile);
      if (!parsedProfile.success) {
        return errorResponse(parsedProfile.error.errors[0].message, 422);
      }
      if (parsedProfile.data.name) {
        await User.findByIdAndUpdate(userId, { name: parsedProfile.data.name });
      }
    }

    // Validate and update settings if provided
    if (settings) {
      const parsedSettings = SettingsSchema.safeParse(settings);
      if (!parsedSettings.success) {
        return errorResponse(parsedSettings.error.errors[0].message, 422);
      }
      
      // Use $set to properly update nested settings object
      const updateData: Record<string, any> = {};
      Object.entries(parsedSettings.data).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[`settings.${key}`] = value;
        }
      });
      
      if (Object.keys(updateData).length > 0) {
        await User.findByIdAndUpdate(userId, { $set: updateData });
      }
    }

    // Fetch updated user
    const updatedUser = await User.findById(userId).select('name email role avatar settings').lean();

    return successResponse({
      profile: {
        name: updatedUser?.name,
        email: updatedUser?.email,
        role: updatedUser?.role,
        avatar: updatedUser?.avatar,
      },
      settings: updatedUser?.settings || {
        companyName: 'NexusCorp Inc.',
        timezone: 'UTC-5',
        currency: 'PKR',
        notifications: true,
        emailAlerts: true,
        twoFA: false,
        auditLog: true,
        sessionTimeout: '30 minutes',
      },
    });
  } catch (err) {
    console.error('PUT /api/settings error:', err);
    return errorResponse('Server error', 500);
  }
}
