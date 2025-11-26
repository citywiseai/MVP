import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET all measurements for a project
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

    const measurements = await prisma.measurement.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ measurements });
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch measurements' },
      { status: 500 }
    );
  }
}

// POST create new measurement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { name, measurementType, points, totalDistance, segmentDistances } = body;

    if (!name || !measurementType || !points || !totalDistance) {
      return NextResponse.json(
        { error: 'Missing required fields: name, measurementType, points, totalDistance' },
        { status: 400 }
      );
    }

    const measurement = await prisma.measurement.create({
      data: {
        projectId,
        name,
        measurementType,
        points,
        totalDistance,
        segmentDistances: segmentDistances || null,
      },
    });

    return NextResponse.json({ measurement });
  } catch (error) {
    console.error('Error creating measurement:', error);
    return NextResponse.json(
      { error: 'Failed to create measurement' },
      { status: 500 }
    );
  }
}
