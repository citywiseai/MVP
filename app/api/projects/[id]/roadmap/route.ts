import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateRoadmap } from '@/lib/roadmap-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const roadmap = await prisma.projectRoadmap.findUnique({
      where: { projectId: id },
      include: {
        phases: {
          orderBy: { order: 'asc' },
          include: {
            tasks: true
          }
        }
      }
    });

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    return NextResponse.json(roadmap);
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Get project to determine type
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if roadmap already exists
    const existing = await prisma.projectRoadmap.findUnique({
      where: { projectId: id }
    });

    if (existing) {
      return NextResponse.json({ error: 'Roadmap already exists' }, { status: 400 });
    }

    // Generate roadmap phases
    const phaseTemplates = generateRoadmap(project.projectType || 'ADU');

    // Create roadmap with phases
    const roadmap = await prisma.projectRoadmap.create({
      data: {
        projectId: id,
        phases: {
          create: phaseTemplates
        }
      },
      include: {
        phases: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json(roadmap, { status: 201 });
  } catch (error) {
    console.error('Error creating roadmap:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
