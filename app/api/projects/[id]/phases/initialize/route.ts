import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { PROJECT_PHASES, PHASE_STATUS } from '@/lib/phases';

const prisma = new PrismaClient();

// POST /api/projects/[id]/phases/initialize - Create default phases for a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('📍 Initialize phases - START');

    const session = await auth();
    if (!session?.user) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Session user:', session.user.email);

    const { id: projectId } = await params;
    console.log('📍 Project ID:', projectId);

    // Verify project ownership - but get more data to help with org membership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        ownerId: true,
        orgId: true,
      },
    });

    if (!project) {
      console.log('❌ Project not found:', projectId);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('📋 Project found:', {
      id: project.id,
      ownerId: project.ownerId,
      orgId: project.orgId,
      sessionUserId: session.user.id
    });

    // Check org membership instead of strict ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        memberships: {
          where: { orgId: project.orgId }
        }
      }
    });

    if (!user || user.memberships.length === 0) {
      console.log('❌ User not member of project org');
      return NextResponse.json({ error: 'Forbidden - not a member of project organization' }, { status: 403 });
    }

    console.log('✅ User is member of project org');

    // Check if roadmap already exists
    const existingRoadmap = await prisma.projectRoadmap.findUnique({
      where: { projectId },
      include: { phases: true },
    });

    if (existingRoadmap && existingRoadmap.phases.length > 0) {
      return NextResponse.json(
        {
          error: 'Phases already initialized for this project',
          roadmap: existingRoadmap
        },
        { status: 400 }
      );
    }

    console.log('📦 Creating roadmap with phases...');

    // Create roadmap with all phases in a transaction
    const roadmap = await prisma.$transaction(async (tx) => {
      // Create or get the roadmap
      let roadmapRecord = existingRoadmap;
      if (!roadmapRecord) {
        console.log('📍 Creating new roadmap record...');
        roadmapRecord = await tx.projectRoadmap.create({
          data: {
            projectId,
          },
        });
        console.log('✅ Roadmap created:', roadmapRecord.id);
      } else {
        console.log('📍 Using existing roadmap:', roadmapRecord.id);
      }

      console.log(`📍 Creating ${PROJECT_PHASES.length} phases...`);
      // Create all 6 phases
      const phasePromises = PROJECT_PHASES.map((phase, index) => {
        console.log(`  Phase ${index + 1}/${PROJECT_PHASES.length}: ${phase.name}`);
        return tx.roadmapPhase.create({
          data: {
            roadmapId: roadmapRecord.id,
            name: phase.name,
            order: phase.order,
            status: phase.order === 1 ? PHASE_STATUS.IN_PROGRESS : PHASE_STATUS.WAITING,
            estimatedDuration: phase.duration,
            description: phase.description,
            startDate: phase.order === 1 ? new Date() : null,
            services: [],
            dependencies: [],
          },
        });
      });

      const phases = await Promise.all(phasePromises);
      console.log('✅ All phases created successfully');

      // Return roadmap with phases
      return tx.projectRoadmap.findUnique({
        where: { id: roadmapRecord.id },
        include: {
          phases: {
            orderBy: { order: 'asc' },
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
          },
        },
      });
    });

    console.log('✅ Roadmap with phases initialized successfully');
    return NextResponse.json({
      roadmap,
      message: 'Phases initialized successfully'
    });
  } catch (error) {
    console.error('❌ Error initializing phases:', error);
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        error: 'Failed to initialize phases',
        details: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    );
  }
}
