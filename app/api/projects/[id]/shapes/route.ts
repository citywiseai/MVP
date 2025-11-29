import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const shapes = await prisma.drawnShape.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ shapes });
  } catch (error) {
    console.error('Error loading shapes:', error);
    return NextResponse.json(
      { error: 'Failed to load shapes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { name, shapeType, coordinates, area, perimeter, properties } = body;

    const shape = await prisma.drawnShape.create({
      data: {
        projectId,
        name,
        shapeType,
        coordinates,
        area,
        perimeter,
        properties: properties || {}
      }
    });

    return NextResponse.json(shape);
  } catch (error) {
    console.error('Error saving shape:', error);
    return NextResponse.json(
      { error: 'Failed to save shape' },
      { status: 500 }
    );
  }
}
