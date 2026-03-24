import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{
    id: string;
    docId: string;
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

    const { status, reviewNotes, isSealed, sealNumber, sealedBy, sealDate, expirationDate } = await request.json();

    // Get old status before updating
    const oldDoc = await prisma.taskDocument.findUnique({
      where: { id: resolvedParams.docId },
      select: { status: true }
    });

    const document = await prisma.taskDocument.update({
      where: { id: resolvedParams.docId },
      data: {
        status,
        reviewNotes,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        isSealed,
        sealNumber,
        sealedBy,
        sealDate: sealDate ? new Date(sealDate) : undefined,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined
      }
    });

    // Update task document counts
    const updates: any = {};

    if (status === 'APPROVED_SEALED' && oldDoc?.status !== 'APPROVED_SEALED') {
      updates.approvedDocuments = { increment: 1 };
      updates.pendingDocuments = { decrement: 1 };
    }

    if (Object.keys(updates).length > 0) {
      await prisma.task.update({
        where: { id: resolvedParams.id },
        data: updates
      });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error updating document status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
