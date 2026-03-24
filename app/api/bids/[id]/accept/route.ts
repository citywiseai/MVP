import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/bids/[id]/accept - Accept this bid, reject others for same task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    console.log('🔐 Accept Bid - Session:', session ? 'Authenticated' : 'Not authenticated');

    if (!session?.user) {
      console.error('❌ No session or user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: bidId } = await params;
    console.log('✅ Accepting bid:', bidId);

    // Find the bid to accept
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        task: true,
      },
    });

    if (!bid) {
      console.error('❌ Bid not found:', bidId);
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    console.log('📝 Updating bids and task in transaction...');

    // Transaction: accept this bid, reject others for same task, update task
    await prisma.$transaction([
      // Accept this bid
      prisma.bid.update({
        where: { id: bidId },
        data: { status: 'accepted' },
      }),
      // Reject other bids for same task
      prisma.bid.updateMany({
        where: {
          taskId: bid.taskId,
          id: { not: bidId },
          status: { not: 'rejected' }, // Only update if not already rejected
        },
        data: { status: 'rejected' },
      }),
      // Update task with accepted bid info
      prisma.task.update({
        where: { id: bid.taskId },
        data: {
          acceptedBidId: bidId,
          vendorId: bid.vendorId,
          estimatedCost: bid.amount,
        },
      }),
    ]);

    console.log('✅ Bid accepted successfully');
    console.log(`   - Accepted bid: ${bidId}`);
    console.log(`   - Task updated: ${bid.taskId}`);
    console.log(`   - Vendor assigned: ${bid.vendorId}`);
    console.log(`   - Estimated cost: $${bid.amount}`);

    // Fetch the full bid with task and phase info
    const updatedBid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        task: {
          include: {
            phase: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Bid accepted successfully',
        bid: updatedBid,
        bidId,
        taskId: bid.taskId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error accepting bid:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      {
        error: 'Failed to accept bid',
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
