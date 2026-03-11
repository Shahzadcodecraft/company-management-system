import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { ZodSchema } from 'zod';
import ActivityLog from '@/models/ActivityLog';
import Notification from '@/models/Notification';
import type { Types } from 'mongoose';

export type ApiRole = 'Admin' | 'Manager' | 'Employee';

export async function requireAuth(req: NextRequest, allowedRoles?: ApiRole[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (allowedRoles && !allowedRoles.includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null; // no error
}

export async function getSession() {
  return getServerSession(authOptions);
}

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function validateBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { data };
  } catch (err: any) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Validation failed', details: err.errors },
        { status: 422 }
      ),
    };
  }
}

export function buildPaginationQuery(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// Notification helper - prevents duplicates within 24 hours
export async function createNotification({
  userId,
  type,
  title,
  message,
  entityType,
  entityId,
  priority = 'medium',
}: {
  userId: string | Types.ObjectId;
  type: 'budget_alert' | 'employee_joined' | 'task_completed' | 'task_assigned' | 'expense_pending' | 'project_created' | 'project_completed' | 'deadline_approaching';
  title: string;
  message: string;
  entityType?: 'Project' | 'Task' | 'Employee' | 'Expense' | 'Department';
  entityId?: string | Types.ObjectId;
  priority?: 'low' | 'medium' | 'high';
}) {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // For entity-based notifications, check if one already exists within 24 hours
    if (entityId) {
      const existing = await Notification.findOne({
        userId,
        type,
        entityId,
        createdAt: { $gte: twentyFourHoursAgo },
      });

      if (existing) {
        // Update the existing notification instead of creating duplicate
        // Only update message/priority, DON'T reset read status
        existing.priority = priority;
        existing.message = message;
        await existing.save();
        return;
      }
    } else {
      // For non-entity notifications (like expense_pending), check by type only
      const existing = await Notification.findOne({
        userId,
        type,
        createdAt: { $gte: twentyFourHoursAgo },
      });

      if (existing) {
        // Update the existing notification
        // Only update message, DON'T reset read status
        existing.message = message;
        await existing.save();
        return;
      }
    }

    // Create new notification if no duplicate found
    await Notification.create({
      userId,
      type,
      title,
      message,
      entityType,
      entityId,
      priority,
      read: false,
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

// Generate notifications based on app events
export async function generateAppNotifications(userId: string) {
  try {
    const Expense = (await import('@/models/Expense')).default;
    const Project = (await import('@/models/Project')).default;
    const Employee = (await import('@/models/Employee')).default;
    const Task = (await import('@/models/Task')).default;

    // 1. Check for projects with low budget (spent > 80% of budget)
    const projectsWithLowBudget = await Project.find({
      $expr: { $gt: ['$spent', { $multiply: ['$budget', 0.8] }] },
      budget: { $gt: 0 },
    }).limit(5);

    for (const project of projectsWithLowBudget) {
      const percentUsed = Math.round((project.spent / project.budget) * 100);
      await createNotification({
        userId,
        type: 'budget_alert',
        title: 'Budget Alert',
        message: `${project.title} budget is at ${percentUsed}% (PKR ${project.spent.toLocaleString()} of PKR ${project.budget.toLocaleString()})`,
        entityType: 'Project',
        entityId: project._id.toString(),
        priority: percentUsed > 95 ? 'high' : 'medium',
      });
    }

    // 2. Check for recently joined employees (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const recentEmployees = await Employee.find({
      joinDate: { $gte: lastWeek },
    }).limit(5);

    for (const emp of recentEmployees) {
      await createNotification({
        userId,
        type: 'employee_joined',
        title: 'New Employee Joined',
        message: `${emp.name} joined as ${emp.role}`,
        entityType: 'Employee',
        entityId: emp._id.toString(),
        priority: 'low',
      });
    }

    // 3. Check for pending expenses
    const pendingExpenses = await Expense.countDocuments({ status: 'Pending' });
    if (pendingExpenses > 0) {
      await createNotification({
        userId,
        type: 'expense_pending',
        title: 'Expenses Pending Approval',
        message: `${pendingExpenses} expense${pendingExpenses > 1 ? 's are' : ' is'} waiting for your approval`,
        entityType: 'Expense',
        priority: 'medium',
      });
    }

    // 4. Check for tasks due soon (next 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const upcomingTasks = await Task.find({
      dueDate: { $lte: threeDaysFromNow, $gte: new Date() },
      status: { $ne: 'Done' },
    }).limit(5);

    for (const task of upcomingTasks) {
      await createNotification({
        userId,
        type: 'deadline_approaching',
        title: 'Task Due Soon',
        message: `"${task.title}" is due on ${task.dueDate.toLocaleDateString()}`,
        entityType: 'Task',
        entityId: task._id.toString(),
        priority: 'high',
      });
    }

    // 5. Check for recently completed projects (last 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const completedProjects = await Project.find({
      status: 'Completed',
      updatedAt: { $gte: threeDaysAgo },
    }).limit(5);

    for (const project of completedProjects) {
      await createNotification({
        userId,
        type: 'project_completed',
        title: 'Project Completed',
        message: `"${project.title}" has been marked as completed`,
        entityType: 'Project',
        entityId: project._id.toString(),
        priority: 'low',
      });
    }

  } catch (err) {
    console.error('Failed to generate app notifications:', err);
  }
}

// Log activity helper
export async function logActivity({
  entityType,
  entityId,
  action,
  performedBy,
  performedByName,
  details,
}: {
  entityType: 'Project' | 'Task' | 'Employee' | 'Expense' | 'Department';
  entityId: string;
  action: string;
  performedBy: string;
  performedByName: string;
  details?: Record<string, unknown>;
}) {
  try {
    await ActivityLog.create({
      entityType,
      entityId,
      action,
      performedBy,
      performedByName,
      details,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
