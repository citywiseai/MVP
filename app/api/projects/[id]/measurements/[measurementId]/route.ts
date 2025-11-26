import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// DELETE a measurement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; measurementId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, measurementId } = await params;

    // Verify measurement belongs to this project
    const measurement = await prisma.measurement.findFirst({
      where: {
        id: measurementId,
        projectId,
      },
    });

    if (!measurement) {
      return NextResponse.json(
        { error: 'Measurement not found' },
        { status: 404 }
      );
    }

    await prisma.measurement.delete({
      where: { id: measurementId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting measurement:', error);
    return NextResponse.json(
      { error: 'Failed to delete measurement' },
      { status: 500 }
    );
  }
}

// PATCH a measurement (update points/distance)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; measurementId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, measurementId } = await params;
    const body = await request.json();
    const { points, totalDistance, segmentDistances, name, displayDistance } = body;

    // Verify measurement belongs to this project
    const measurement = await prisma.measurement.findFirst({
      where: {
        id: measurementId,
        projectId,
      },
    });

    if (!measurement) {
      return NextResponse.json(
        { error: 'Measurement not found' },
        { status: 404 }
      );
    }

    // Build update data object with only provided fields
    const updateData: any = {};
    if (points !== undefined) updateData.points = points;
    if (totalDistance !== undefined) updateData.totalDistance = totalDistance;
    if (segmentDistances !== undefined) updateData.segmentDistances = segmentDistances;
    if (name !== undefined) updateData.name = name;
    if (displayDistance !== undefined) updateData.displayDistance = displayDistance;

    // Update the measurement
    const updated = await prisma.measurement.update({
      where: { id: measurementId },
      data: updateData,
    });

    return NextResponse.json({ measurement: updated });
  } catch (error) {
    console.error('Error updating measurement:', error);
    return NextResponse.json(
      { error: 'Failed to update measurement' },
      { status: 500 }
    );
  }
}
