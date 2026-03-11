import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Investor from '@/models/Investor';
import Project from '@/models/Project';

// GET /api/investors - Get all investors with finance summary
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const query: any = {};
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }

    const investors = await Investor.find(query).sort({ investmentDate: -1 }).lean();

    // Calculate investment summary
    const totalInvestmentAmount = investors.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        investors,
        summary: {
          totalInvestmentAmount,
          investorCount: investors.length,
          activeInvestors: investors.filter(inv => inv.isActive).length,
        },
      },
    });
  } catch (error: any) {
    console.error('GET /api/investors error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch investors' }, { status: 500 });
  }
}

// POST /api/investors - Create new investor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, company, investmentAmount, investmentDate, investmentType, returnTerms, paymentMethod, investmentPurpose, image, notes } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Name and email are required' }, { status: 400 });
    }

    await dbConnect();

    const investor = await Investor.create({
      name,
      email,
      phone,
      company,
      investmentAmount: investmentAmount || 0,
      investmentDate: investmentDate || new Date(),
      investmentType: investmentType || 'Other',
      returnTerms,
      paymentMethod,
      investmentPurpose,
      image,
      notes,
    });

    return NextResponse.json({ success: true, data: investor }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/investors error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Investor with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to create investor' }, { status: 500 });
  }
}
