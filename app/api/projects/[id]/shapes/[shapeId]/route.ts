import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shapeId: string }> }
) {
  try {
    const { shapeId } = await params;
    const body = await request.json();

    const shape = await prisma.drawnShape.update({
      where: { id: shapeId },
      data: body
    });

    return NextResponse.json({ shape });
  } catch (error) {
    console.error('Error updating shape:', error);
    return NextResponse.json(
      { error: 'Failed to update shape' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shapeId: string }> }
) {
  try {
    const { shapeId } = await params;

    await prisma.drawnShape.delete({
      where: { id: shapeId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shape:', error);
    return NextResponse.json(
      { error: 'Failed to delete shape' },
      { status: 500 }
    );
  }
}
