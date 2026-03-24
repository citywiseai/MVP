import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const floorPlans = await prisma.floorPlan.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(floorPlans);
  } catch (error) {
    console.error('Error fetching floor plans:', error);
    return NextResponse.json({ error: 'Failed to fetch floor plans' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      name,
      imageUrl,
      squareFootage,
      bedrooms,
      bathrooms,
      stories,
      style,
      generatedBy,
      prompt,
    } = body;

    const floorPlan = await prisma.floorPlan.create({
      data: {
        projectId: id,
        name: name || `Floor Plan ${new Date().toLocaleDateString()}`,
        imageUrl,
        squareFootage,
        bedrooms,
        bathrooms,
        stories,
        style,
        generatedBy: generatedBy || 'ai',
        prompt,
      },
    });

    return NextResponse.json(floorPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating floor plan:', error);
    return NextResponse.json({ error: 'Failed to create floor plan' }, { status: 500 });
  }
}
