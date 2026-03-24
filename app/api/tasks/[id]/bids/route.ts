import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
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

    // Verify task belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id: resolvedParams.id,
        project: {
          ownerId: user.id
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const bids = await prisma.taskBid.findMany({
      where: {
        taskId: resolvedParams.id
      },
      include: {
        contact: true
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    return NextResponse.json({ bids });
  } catch (error) {
    console.error('Error fetching bids:', error);
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 });
  }
}

export async function POST(
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
          ownerId: user.id
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Calculate dates if estimatedWeeks provided
    let startDate = data.startDate ? new Date(data.startDate) : null;
    let endDate = data.endDate ? new Date(data.endDate) : null;

    if (data.estimatedWeeks && startDate) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (data.estimatedWeeks * 7));
    }

    // Create bid
    const bid = await prisma.taskBid.create({
      data: {
        taskId: resolvedParams.id,
        contactId: data.contactId || null,
        contactName: data.contactName,
        contactCompany: data.contactCompany,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        contactAddress: data.contactAddress,
        cost: data.cost ? parseFloat(data.cost) : null,
        estimatedWeeks: data.estimatedWeeks ? parseInt(data.estimatedWeeks) : null,
        notes: data.notes,
        startDate,
        endDate,
        status: 'PENDING'
      },
      include: {
        contact: true
      }
    });

    // Update task analytics
    await prisma.task.update({
      where: { id: resolvedParams.id },
      data: {
        totalBidsReceived: {
          increment: 1
        }
      }
    });

    // Update contact analytics if linked
    if (data.contactId) {
      await prisma.contact.update({
        where: { id: data.contactId },
        data: {
          totalBids: {
            increment: 1
          }
        }
      });
    }

    return NextResponse.json({ bid }, { status: 201 });
  } catch (error) {
    console.error('Error creating bid:', error);
    return NextResponse.json({ error: 'Failed to create bid' }, { status: 500 });
  }
}
