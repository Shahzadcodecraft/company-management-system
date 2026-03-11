import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Salary from '@/models/Salary';
import { getSession, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();

    // Get unique years from salary records
    const years = await Salary.distinct('year');

    // Sort years in descending order (newest first)
    const sortedYears = years.sort((a, b) => b - a);

    // Get current, previous, and next year
    const currentYear = new Date().getFullYear();

    // Ensure current year, previous year and next year are included
    const yearsToInclude = new Set([
      currentYear - 1,
      currentYear,
      currentYear + 1,
      ...sortedYears
    ]);

    // Convert to array and sort
    const allYears = Array.from(yearsToInclude)
      .filter(year => year >= 2000) // Only include years from 2000 onwards
      .sort((a, b) => b - a);

    return successResponse({
      years: allYears,
      currentYear,
      previousYear: currentYear - 1,
      nextYear: currentYear + 1,
      count: allYears.length
    });
  } catch (err) {
    console.error('GET years error:', err);
    return errorResponse('Server error', 500);
  }
}
