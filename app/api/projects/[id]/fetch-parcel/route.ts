import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';;



export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get project
    const project = await prisma.project.findUnique({
      where: { id },
      include: { parcel: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // No address to fetch
    if (!project.fullAddress) {
      return NextResponse.json({ error: 'No address to fetch' }, { status: 400 });
    }

    // Fetch complete parcel data from Regrid (including propertyMetadata)
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/parcels/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: project.fullAddress }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch parcel data' }, { status: 500 });
    }

    const result = await response.json();

    if (!result.success || !result.parcel) {
      return NextResponse.json({ error: 'Failed to fetch parcel data' }, { status: 500 });
    }

    // The /api/parcels/fetch endpoint already created/updated the parcel with complete data
    const parcel = result.parcel;

    // Link the parcel to the project if not already linked
    if (!project.parcelId || project.parcelId !== parcel.id) {
      await prisma.project.update({
        where: { id },
        data: { parcelId: parcel.id }
      });
    }

    return NextResponse.json({ success: true, parcel });
  } catch (error) {
    console.error('Error fetching parcel:', error);
    return NextResponse.json({ error: 'Failed to fetch parcel' }, { status: 500 });
  }
}
