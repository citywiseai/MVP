import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { setbacks } = await req.json();
    
    // Validate setbacks
    if (!setbacks || typeof setbacks !== 'object') {
      return NextResponse.json({ error: 'Invalid setbacks data' }, { status: 400 });
    }
    
    const { front, rear, left, right } = setbacks;
    
    if (typeof front !== 'number' || typeof rear !== 'number' || 
        typeof left !== 'number' || typeof right !== 'number') {
      return NextResponse.json({ error: 'All setback values must be numbers' }, { status: 400 });
    }
    
    // Get project with parcel
    const project = await prisma.project.findUnique({
      where: { id },
      include: { parcel: true }
    });
    
    if (!project || !project.parcel) {
      return NextResponse.json({ error: 'Project or parcel not found' }, { status: 404 });
    }
    
    // Update parcel with setbacks
    await prisma.parcel.update({
      where: { id: project.parcel.id },
      data: { setbacks: setbacks }
    });
    
    console.log('✅ Saved setbacks:', setbacks);
    
    return NextResponse.json({ success: true, setbacks });
  } catch (error) {
    console.error('Error saving setbacks:', error);
    return NextResponse.json({ error: 'Failed to save setbacks' }, { status: 500 });
  }
}
