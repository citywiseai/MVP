import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analyses = await prisma.siteAnalysis.findMany({
      where: {
        userId: session.user.id,
        status: 'completed',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to most recent 10
      select: {
        id: true,
        address: true,
        apn: true,
        latitude: true,
        longitude: true,
        lotSizeSqFt: true,
        zoning: true,
        zoningDescription: true,
        existingBuildingSqFt: true,
        existingStories: true,
        maxBuildableArea: true,
        currentCoverage: true,
        remainingArea: true,
        zoningRules: true,
        assessorData: true,
        feasibilityReport: true,
        overallAssessment: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('Error fetching saved analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved analyses' },
      { status: 500 }
    );
  }
}
