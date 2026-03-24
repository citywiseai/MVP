import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getBusinessDaysBetween } from '@/lib/timelineCalculator';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { estimatedEndDate, startDate, estimatedDays } = body;

    const phase = await prisma.roadmapPhase.findUnique({
      where: { id }
    });

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    // Calculate estimated days if end date provided and start date exists
    let calculatedEstimatedDays = estimatedDays || phase.estimatedDays;
    if (estimatedEndDate && phase.startDate) {
      calculatedEstimatedDays = getBusinessDaysBetween(
        new Date(phase.startDate),
        new Date(estimatedEndDate)
      );
    }

    const updated = await prisma.roadmapPhase.update({
      where: { id },
      data: {
        estimatedDays: calculatedEstimatedDays,
        endDate: estimatedEndDate ? new Date(estimatedEndDate) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating phase timeline:', error);
    return NextResponse.json({ error: 'Failed to update timeline' }, { status: 500 });
  }
}
