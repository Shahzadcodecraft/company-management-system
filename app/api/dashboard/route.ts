import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Employee from '@/models/Employee';
import Department from '@/models/Department';
import Project from '@/models/Project';
import Task from '@/models/Task';
import Expense from '@/models/Expense';
import { getSession, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();

    const [
      totalEmployees,
      activeEmployees,
      totalDepartments,
      activeProjects,
      totalProjects,
      pendingTasks,
      doneTasks,
      totalTasks,
      pendingExpenses,
      approvedExpenses,
      recentEmployees,
      recentProjects,
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'Active' }),
      Department.countDocuments(),
      Project.countDocuments({ status: 'In Progress' }),
      Project.countDocuments(),
      Task.countDocuments({ status: { $ne: 'Done' } }),
      Task.countDocuments({ status: 'Done' }),
      Task.countDocuments(),
      Expense.countDocuments({ status: 'Pending' }),
      Expense.aggregate([
        { $match: { status: 'Approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Employee.find().sort({ createdAt: -1 }).limit(5).lean(),
      Project.find({ status: 'In Progress' }).populate('department', 'name').sort({ updatedAt: -1 }).limit(5).lean(),
    ]);

    // Calculate progress for each project based on task completion
    const taskProgress = await Task.aggregate([
      { $match: { project: { $in: recentProjects.map((p: any) => p._id) } } },
      { $group: { _id: '$project', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } } } },
    ]);
    const progressMap = new Map(taskProgress.map((t: any) => [t._id.toString(), t.total > 0 ? Math.round((t.done / t.total) * 100) : 0]));

    const projectsWithProgress = recentProjects.map((p: any) => ({
      ...p,
      progress: progressMap.get(p._id.toString()) || p.progress || 0,
    }));
    const taskDistribution = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Employee by department
    const empByDept = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$dept.name', 'Unassigned'] }, count: 1 } },
    ]);

    // Performance by department
    const performanceByDept = await Employee.aggregate([
      { $match: { department: { $exists: true }, performance: { $exists: true } } },
      { $group: { _id: '$department', avgPerformance: { $avg: '$performance' }, count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$dept.name', 'Unassigned'] }, avgPerformance: { $round: ['$avgPerformance', 1] }, count: 1 } },
      { $sort: { avgPerformance: -1 } },
    ]);

    return successResponse({
      stats: {
        totalEmployees,
        activeEmployees,
        totalDepartments,
        activeProjects,
        totalProjects,
        pendingTasks,
        doneTasks,
        totalTasks,
        pendingExpenses,
        approvedExpensesTotal: approvedExpenses[0]?.total || 0,
      },
      recentEmployees,
      recentProjects: projectsWithProgress,
      taskDistribution,
      empByDept,
      performanceByDept,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return errorResponse('Server error', 500);
  }
}
