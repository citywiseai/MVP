import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PROJECT_PHASES } from '@/lib/phases';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get the project's roadmap
    const roadmap = await prisma.projectRoadmap.findUnique({
      where: { projectId: id },
      include: {
        phases: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    // Update each phase with new names and descriptions from PROJECT_PHASES
    const updatePromises = roadmap.phases.map(async (phase) => {
      const phaseTemplate = PROJECT_PHASES.find(p => p.order === phase.order);

      if (phaseTemplate) {
        return prisma.roadmapPhase.update({
          where: { id: phase.id },
          data: {
            name: phaseTemplate.name,
            description: phaseTemplate.description,
            estimatedDuration: phaseTemplate.duration,
          }
        });
      }
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Phase names and descriptions updated successfully',
      updatedCount: roadmap.phases.length
    });
  } catch (error) {
    console.error('Error migrating phase names:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
