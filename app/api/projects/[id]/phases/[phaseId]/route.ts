import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { PHASE_STATUS } from '@/lib/phases';

const prisma = new PrismaClient();

// PUT /api/projects/[id]/phases/[phaseId] - Update a specific phase
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, phaseId } = await params;
    const body = await request.json();
    const { status, description, estimatedDuration } = body;

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current phase
    const currentPhase = await prisma.roadmapPhase.findUnique({
      where: { id: phaseId },
    });

    if (!currentPhase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    // Handle status transitions
    if (status && status !== currentPhase.status) {
      updateData.status = status;

      // Set startDate when transitioning to in_progress
      if (status === PHASE_STATUS.IN_PROGRESS && !currentPhase.startDate) {
        updateData.startDate = new Date();
      }

      // Set endDate when transitioning to completed
      if (status === PHASE_STATUS.COMPLETED) {
        updateData.endDate = new Date();
      }

      // Clear endDate if reopening a completed phase
      if (
        status === PHASE_STATUS.IN_PROGRESS &&
        currentPhase.status === PHASE_STATUS.COMPLETED
      ) {
        updateData.endDate = null;
      }

      // Clear dates if skipping
      if (status === PHASE_STATUS.SKIPPED) {
        updateData.startDate = null;
        updateData.endDate = null;
      }
    }

    // Update description if provided
    if (description !== undefined) {
      updateData.description = description;
    }

    // Update estimated duration if provided
    if (estimatedDuration !== undefined) {
      updateData.estimatedDuration = estimatedDuration;
    }

    // Update the phase
    const updatedPhase = await prisma.roadmapPhase.update({
      where: { id: phaseId },
      data: updateData,
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    return NextResponse.json({ phase: updatedPhase });
  } catch (error) {
    console.error('Error updating phase:', error);
    return NextResponse.json(
      { error: 'Failed to update phase' },
      { status: 500 }
    );
  }
}
