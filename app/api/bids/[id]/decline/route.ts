import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/bids/[id]/decline - Decline/reject this bid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    console.log('🔐 Decline Bid - Session:', session ? 'Authenticated' : 'Not authenticated');

    if (!session?.user) {
      console.error('❌ No session or user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: bidId } = await params;
    console.log('❌ Declining bid:', bidId);

    // Find the bid to decline
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
    });

    if (!bid) {
      console.error('❌ Bid not found:', bidId);
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    console.log('📝 Updating bid status to rejected...');

    // Update bid status to rejected
    await prisma.bid.update({
      where: { id: bidId },
      data: { status: 'rejected' },
    });

    console.log('✅ Bid declined successfully');
    console.log(`   - Rejected bid: ${bidId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Bid declined successfully',
        bidId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error declining bid:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      {
        error: 'Failed to decline bid',
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
