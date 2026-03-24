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

    // Update bid dates
    const bid = await prisma.taskBid.update({
      where: { id: resolvedParams.bidId },
      data: {
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        actualCompletionDate: data.actualCompletionDate ? new Date(data.actualCompletionDate) : undefined
      },
      include: {
        contact: true
      }
    });

    return NextResponse.json({ bid });
  } catch (error) {
    console.error('Error updating bid dates:', error);
    return NextResponse.json({ error: 'Failed to update bid dates' }, { status: 500 });
  }
}
