import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ProjectRoadmap } from '@/types/roadmap';

interface RouteParams {
  params: Promise<{
    id: string;
    phaseId: string;
  }>;
}

/**
 * PATCH /api/projects/[id]/roadmap/phase/[phaseId]
 * Update a specific phase's status or properties
 * Body: { status?: 'not_started' | 'in_progress' | 'completed' | 'blocked' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id, phaseId } = resolvedParams;
    const body = await request.json();

    console.log('🔧 PATCH /api/projects/[id]/roadmap/phase/[phaseId] called');
    console.log('   Project ID:', id);
    console.log('   Phase ID:', phaseId);
    console.log('   Body:', body);

    // Fetch existing roadmap
    const existingRoadmap = await prisma.projectRoadmap.findUnique({
      where: { projectId: id },
    });

    if (!existingRoadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    // Convert to typed roadmap
    const currentRoadmap: ProjectRoadmap = {
      id: existingRoadmap.id,
      projectId: existingRoadmap.projectId,
      phases: existingRoadmap.phases as any,
      currentPhaseId: existingRoadmap.currentPhaseId,
      overallProgress: existingRoadmap.overallProgress,
      estimatedCompletionDate: existingRoadmap.estimatedCompletionDate,
      createdAt: existingRoadmap.createdAt,
      updatedAt: existingRoadmap.updatedAt,
    };

    // Update the phase status
    const updatedPhases = currentRoadmap.phases.map((phase) =>
      phase.id === phaseId
        ? { ...phase, status: body.status || phase.status }
        : phase
    );

    // Recalculate overall progress if phase was marked as completed
    let overallProgress = currentRoadmap.overallProgress;
    if (body.status === 'completed') {
      const completedCount = updatedPhases.filter((p) => p.status === 'completed').length;
      overallProgress = Math.round((completedCount / updatedPhases.length) * 100);
    }

    // Save to database
    const savedRoadmap = await prisma.projectRoadmap.update({
      where: { id: existingRoadmap.id },
      data: {
        phases: updatedPhases as any,
        overallProgress,
      },
    });

    console.log('✅ Phase updated - Status:', body.status);
    console.log('✅ Overall progress:', overallProgress, '%');

    return NextResponse.json(savedRoadmap);
  } catch (error) {
    console.error('Update phase API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
