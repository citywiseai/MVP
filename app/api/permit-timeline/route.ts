import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jurisdiction = searchParams.get('jurisdiction')?.toLowerCase() || 'phoenix';
    const permitType = searchParams.get('type');

    if (permitType) {
      const timeline = await prisma.permitTimeline.findFirst({
        where: { jurisdiction, permitType }
      });
      return NextResponse.json(timeline);
    }

    // Return all timelines for jurisdiction
    const timelines = await prisma.permitTimeline.findMany({
      where: { jurisdiction }
    });
    return NextResponse.json(timelines);
  } catch (error) {
    console.error('Error fetching permit timeline:', error);
    return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
  }
}
