import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(
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

    const floorPlan = await prisma.floorPlan.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(floorPlan);
  } catch (error) {
    console.error('Error updating floor plan:', error);
    return NextResponse.json({ error: 'Failed to update floor plan' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.floorPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting floor plan:', error);
    return NextResponse.json({ error: 'Failed to delete floor plan' }, { status: 500 });
  }
}
