import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, setbacks } = body;

    // Validate input
    if (!projectId || !setbacks) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update the project with new setback values
    const updatedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        setbackFront: setbacks.front,
        setbackRear: setbacks.rear,
        setbackSideLeft: setbacks.sideLeft,
        setbackSideRight: setbacks.sideRight,
      },
    });

    return NextResponse.json({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    console.error('Error updating setbacks:', error);
    return NextResponse.json(
      { error: 'Failed to update setbacks' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get the project with setback values
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
        setbackFront: true,
        setbackRear: true,
        setbackSideLeft: true,
        setbackSideRight: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      setbacks: {
        front: project.setbackFront,
        rear: project.setbackRear,
        sideLeft: project.setbackSideLeft,
        sideRight: project.setbackSideRight,
      },
    });
  } catch (error) {
    console.error('Error fetching setbacks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setbacks' },
      { status: 500 }
    );
  }
}
