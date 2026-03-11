import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Salary from '@/models/Salary';
import { getSession, errorResponse } from '@/lib/api-helpers';
import { jsPDF } from 'jspdf';

export const dynamic = 'force-dynamic';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Format number with commas
function formatAmount(num: number): string {
  return 'Rs. ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return errorResponse('Unauthorized', 401);

    await dbConnect();

    const salary = await Salary.findById(params.id)
      .populate('employee', 'name email department role avatar')
      .lean();

    if (!salary) {
      return errorResponse('Salary record not found', 404);
    }

    const doc = new jsPDF();
    const employee = salary.employee as any;
    
    const baseSalary = salary.baseSalary || 0;
    const bonus = salary.bonus || 0;
    const deductions = salary.deductions || 0;
    const totalAmount = salary.totalAmount || 0;
    const paidAmount = salary.paidAmount || 0;
    const remaining = totalAmount - paidAmount;
    const grossEarnings = baseSalary + bonus;

    // Header
    doc.setFontSize(18);
    (doc as any).setFont('helvetica', 'bold');
    doc.text('SALARY SLIP', 105, 15, { align: 'center' });

    doc.setFontSize(9);
    (doc as any).setFont('helvetica', 'normal');
    doc.text('NexusCMS - Enterprise Management System', 105, 22, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 27, { align: 'center' });

    // Line
    doc.setDrawColor(180, 180, 180);
    doc.line(14, 32, 196, 32);

    // Employee Info (Left) | Salary Period (Right)
    let y = 40;
    
    doc.setFontSize(11);
    (doc as any).setFont('helvetica', 'bold');
    doc.text('Employee Information', 14, y);
    doc.text('Salary Period', 120, y);

    y += 7;
    doc.setFontSize(9);
    (doc as any).setFont('helvetica', 'normal');
    doc.text(`Name: ${employee?.name || 'N/A'}`, 14, y);
    doc.text(`Month: ${MONTHS[salary.month - 1]} ${salary.year}`, 120, y);
    
    y += 5;
    doc.text(`Department: ${employee?.department?.name || employee?.department || 'N/A'}`, 14, y);
    doc.text(`Status: ${salary.status}`, 120, y);
    
    y += 5;
    doc.text(`Role: ${employee?.role || 'N/A'}`, 14, y);

    // Line
    y += 8;
    doc.line(14, y, 196, y);

    // EARNINGS TABLE
    y += 10;
    doc.setFontSize(11);
    (doc as any).setFont('helvetica', 'bold');
    doc.text('EARNINGS', 14, y);
    doc.text('AMOUNT', 95, y);
    doc.text('DEDUCTIONS', 125, y);
    doc.text('AMOUNT', 175, y);

    y += 8;
    doc.setFontSize(9);
    (doc as any).setFont('helvetica', 'normal');
    
    // Row 1: Base Salary | Deductions
    doc.text('Base Salary', 14, y);
    doc.text(formatAmount(baseSalary), 95, y, { align: 'right' });
    doc.text('Deductions', 125, y);
    doc.text(formatAmount(deductions), 175, y, { align: 'right' });

    y += 6;
    // Row 2: Bonus
    doc.text('Bonus', 14, y);
    doc.text(formatAmount(bonus), 95, y, { align: 'right' });

    y += 10;
    // Totals Line
    doc.setDrawColor(150, 150, 150);
    doc.line(14, y - 3, 110, y - 3);
    doc.line(120, y - 3, 196, y - 3);

    y += 5;
    doc.setFontSize(10);
    (doc as any).setFont('helvetica', 'bold');
    doc.text('Gross Earnings:', 14, y);
    doc.text(formatAmount(grossEarnings), 95, y, { align: 'right' });
    doc.text('Total Deductions:', 125, y);
    doc.text(formatAmount(deductions), 175, y, { align: 'right' });

    // NET PAY BOX
    y += 12;
    doc.setFillColor(230, 245, 255);
    doc.rect(14, y - 6, 182, 18, 'F');
    doc.setDrawColor(100, 150, 200);
    doc.rect(14, y - 6, 182, 18, 'S');

    doc.setFontSize(12);
    (doc as any).setFont('helvetica', 'bold');
    doc.text('NET PAYABLE', 20, y + 4);
    
    doc.setFontSize(13);
    doc.text(formatAmount(totalAmount), 180, y + 4, { align: 'right' });

    // PAYMENT DETAILS
    y += 22;
    doc.setFontSize(11);
    (doc as any).setFont('helvetica', 'bold');
    doc.text('Payment Details', 14, y);

    y += 8;
    doc.setFontSize(9);
    (doc as any).setFont('helvetica', 'normal');
    doc.text(`Paid Amount: ${formatAmount(paidAmount)}`, 14, y);
    doc.text(`Remaining: ${formatAmount(remaining)}`, 110, y);

    y += 6;
    doc.text(`Payment Method: ${salary.paymentMethod || 'N/A'}`, 14, y);
    doc.text(`Transaction ID: ${salary.transactionId || 'N/A'}`, 110, y);

    if (salary.paidAt) {
      y += 6;
      doc.text(`Paid Date: ${new Date(salary.paidAt).toLocaleDateString()}`, 14, y);
    }

    // NOTES
    if (salary.notes) {
      y += 12;
      doc.setFontSize(11);
      (doc as any).setFont('helvetica', 'bold');
      doc.text('Notes:', 14, y);
      
      y += 6;
      doc.setFontSize(9);
      (doc as any).setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(salary.notes, 180);
      doc.text(splitNotes, 14, y);
    }

    // FOOTER
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('This is a computer-generated salary slip and does not require signature.', 105, pageHeight - 15, { align: 'center' });
    doc.text(`Record ID: ${salary._id}`, 105, pageHeight - 10, { align: 'center' });

    // Generate PDF
    const pdfBuffer = doc.output('arraybuffer');

    // Return PDF as response
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="salary-slip-${employee?.name?.replace(/\s+/g, '-') || 'employee'}-${MONTHS[salary.month - 1]}-${salary.year}.pdf"`,
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return errorResponse('Failed to generate PDF', 500);
  }
}
