import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/bids/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('📥 Fetching bid:', id);

    const bid = await prisma.bid.findUnique({
      where: { id },
      include: {
        vendor: true,
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
    });

    if (!bid) {
      console.error('❌ Bid not found:', id);
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    console.log('✅ Bid found:', bid.id);
    return NextResponse.json({ bid }, { status: 200 });
  } catch (error) {
    console.error('❌ Error fetching bid:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bid' },
      { status: 500 }
    );
  }
}

// PATCH /api/bids/[id] - Update bid
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    console.log('📝 Updating bid:', id, body);

    const updateData: any = {};

    if (body.amount !== undefined) {
      const parsedAmount = parseFloat(body.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be a positive number' },
          { status: 400 }
        );
      }
      updateData.amount = parsedAmount;
    }

    if (body.status) {
      updateData.status = body.status;
    }

    if (body.estimatedCompletionDate !== undefined) {
      updateData.estimatedCompletionDate = body.estimatedCompletionDate
        ? new Date(body.estimatedCompletionDate)
        : null;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes || null;
    }

    const bid = await prisma.bid.update({
      where: { id },
      data: updateData,
      include: {
        vendor: true,
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    console.log('✅ Bid updated:', bid.id);
    return NextResponse.json({ bid }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error updating bid:', error);
    return NextResponse.json(
      {
        error: 'Failed to update bid',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/bids/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log('🗑️ Deleting bid:', id);

    await prisma.bid.delete({
      where: { id },
    });

    console.log('✅ Bid deleted:', id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error deleting bid:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete bid',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
