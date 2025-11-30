import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test if projectRoadmap model exists
    const hasModel = !!prisma.projectRoadmap;

    if (!hasModel) {
      return NextResponse.json({
        error: 'projectRoadmap model not found',
        prismaKeys: Object.keys(prisma)
      }, { status: 500 });
    }

    // Try to count roadmaps
    const count = await prisma.projectRoadmap.count();

    return NextResponse.json({
      success: true,
      message: 'Prisma client is working correctly',
      roadmapCount: count,
      hasProjectRoadmapModel: true
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
