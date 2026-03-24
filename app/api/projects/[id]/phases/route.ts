import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/projects/[id]/phases - Get all phases for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get the project and verify ownership
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

    // Get roadmap with phases and task counts
    const roadmap = await prisma.projectRoadmap.findUnique({
      where: { projectId },
      include: {
        phases: {
          include: {
            tasks: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                vendor: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found. Initialize phases first.' }, { status: 404 });
    }

    // Calculate progress for each phase based on tasks
    const phasesWithProgress = roadmap.phases.map(phase => {
      const totalTasks = phase.tasks.length;
      const completedTasks = phase.tasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETE').length;
      const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        ...phase,
        taskCount: totalTasks,
        completedTaskCount: completedTasks,
        taskProgress,
      };
    });

    return NextResponse.json({
      roadmap: {
        id: roadmap.id,
        projectId: roadmap.projectId,
        phases: phasesWithProgress,
      },
    });
  } catch (error) {
    console.error('Error fetching phases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch phases' },
      { status: 500 }
    );
  }
}
