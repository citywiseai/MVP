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

    // Update bid with rejection
    const bid = await prisma.taskBid.update({
      where: { id: resolvedParams.bidId },
      data: {
        status: 'REJECTED',
        rejectionReason: data.rejectionReason,
        rejectionNotes: data.rejectionNotes,
        reviewedAt: new Date(),
        reviewedBy: user.email
      },
      include: {
        contact: true
      }
    });

    // Update contact analytics if linked
    if (bid.contactId) {
      await prisma.contact.update({
        where: { id: bid.contactId },
        data: {
          rejectedBids: {
            increment: 1
          }
        }
      });
    }

    return NextResponse.json({ bid });
  } catch (error) {
    console.error('Error rejecting bid:', error);
    return NextResponse.json({ error: 'Failed to reject bid' }, { status: 500 });
  }
}
