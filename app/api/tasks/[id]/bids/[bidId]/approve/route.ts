import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{
    id: string;
    bidId: string;
  }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resolvedParams = await params;
    const data = await request.json();

    // Verify task belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id: resolvedParams.id,
        project: {
          userId: user.id
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get the bid
    const existingBid = await prisma.taskBid.findUnique({
      where: { id: resolvedParams.bidId }
    });

    if (!existingBid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    // Update bid status
    const bid = await prisma.taskBid.update({
      where: { id: resolvedParams.bidId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: user.email,
        startDate: data.startDate ? new Date(data.startDate) : existingBid.startDate,
        endDate: data.endDate ? new Date(data.endDate) : existingBid.endDate
      },
      include: {
        contact: true
      }
    });

    // Update task with selected bid info
    await prisma.task.update({
      where: { id: resolvedParams.id },
      data: {
        selectedBidCost: bid.cost,
        selectedBidWeeks: bid.estimatedWeeks
      }
    });

    // Update contact analytics if linked
    if (bid.contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: bid.contactId },
        include: {
          bids: {
            where: {
              status: 'APPROVED'
            }
          }
        }
      });

      if (contact) {
        // Calculate average cost and timeline for approved bids
        const approvedBids = contact.bids;
        const avgCost = approvedBids.length > 0
          ? approvedBids.reduce((sum, b) => sum + (b.cost || 0), 0) / approvedBids.length
          : null;
        const avgWeeks = approvedBids.length > 0
          ? approvedBids.reduce((sum, b) => sum + (b.estimatedWeeks || 0), 0) / approvedBids.length
          : null;

        await prisma.contact.update({
          where: { id: bid.contactId },
          data: {
            approvedBids: {
              increment: 1
            },
            avgCost,
            avgTimelineWeeks: avgWeeks
          }
        });
      }
    }

    return NextResponse.json({ bid });
  } catch (error) {
    console.error('Error approving bid:', error);
    return NextResponse.json({ error: 'Failed to approve bid' }, { status: 500 });
  }
}
