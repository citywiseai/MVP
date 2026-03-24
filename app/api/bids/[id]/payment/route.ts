import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { paymentStatus, amountPaid, paymentDate, invoiceNumber, paymentNotes } = body;

    const bid = await prisma.bid.update({
      where: { id },
      data: {
        paymentStatus,
        amountPaid: amountPaid || 0,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        invoiceNumber: invoiceNumber || null,
        paymentNotes: paymentNotes || null,
      },
      include: { vendor: true },
    });

    console.log('💰 Payment updated:', bid.id, paymentStatus, `$${amountPaid}`);

    return NextResponse.json(bid);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}
