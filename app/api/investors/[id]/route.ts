import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Investor from '@/models/Investor';
import mongoose from 'mongoose';

// GET /api/investors/[id] - Get single investor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid investor ID' }, { status: 400 });
    }

    await dbConnect();

    const investor = await Investor.findById(id).lean();
    if (!investor) {
      return NextResponse.json({ success: false, error: 'Investor not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: investor,
    });
  } catch (error: any) {
    console.error('GET /api/investors/[id] error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch investor' }, { status: 500 });
  }
}

// PUT /api/investors/[id] - Update investor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid investor ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, phone, company, investmentAmount, investmentDate, investmentType, returnTerms, paymentMethod, investmentPurpose, image, notes, isActive } = body;

    await dbConnect();

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (investmentAmount !== undefined) updateData.investmentAmount = investmentAmount;
    if (investmentDate !== undefined) updateData.investmentDate = investmentDate;
    if (investmentType !== undefined) updateData.investmentType = investmentType;
    if (returnTerms !== undefined) updateData.returnTerms = returnTerms;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (investmentPurpose !== undefined) updateData.investmentPurpose = investmentPurpose;
    if (image !== undefined) updateData.image = image;
    if (notes !== undefined) updateData.notes = notes;
    if (isActive !== undefined) updateData.isActive = isActive;

    const investor = await Investor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!investor) {
      return NextResponse.json({ success: false, error: 'Investor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: investor });
  } catch (error: any) {
    console.error('PUT /api/investors/[id] error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Investor with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to update investor' }, { status: 500 });
  }
}

// DELETE /api/investors/[id] - Delete investor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid investor ID' }, { status: 400 });
    }

    await dbConnect();

    const investor = await Investor.findByIdAndDelete(id);
    if (!investor) {
      return NextResponse.json({ success: false, error: 'Investor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Investor deleted successfully' });
  } catch (error: any) {
    console.error('DELETE /api/investors/[id] error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete investor' }, { status: 500 });
  }
}
