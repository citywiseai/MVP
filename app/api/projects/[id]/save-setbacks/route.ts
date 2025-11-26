import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { setbacks, edgeLabels } = await req.json();

    console.log('📥 Received save-setbacks request:', { setbacks, edgeLabels });

    // Validate setbacks
    if (!setbacks || typeof setbacks !== 'object') {
      return NextResponse.json({ error: 'Invalid setbacks data' }, { status: 400, headers: corsHeaders });
    }

    const { front, rear, left, right } = setbacks;

    if (typeof front !== 'number' || typeof rear !== 'number' ||
        typeof left !== 'number' || typeof right !== 'number') {
      return NextResponse.json({ error: 'All setback values must be numbers' }, { status: 400, headers: corsHeaders });
    }

    // Get project with parcel
    const project = await prisma.project.findUnique({
      where: { id },
      include: { parcel: true }
    });

    if (!project || !project.parcel) {
      return NextResponse.json({ error: 'Project or parcel not found' }, { status: 404, headers: corsHeaders });
    }

    // Prepare update data
    const updateData: any = { setbacks: setbacks };

    // If edgeLabels provided, save them too
    if (edgeLabels && Array.isArray(edgeLabels)) {
      updateData.edgeLabels = edgeLabels;
      console.log('💾 Saving edge labels to database:', edgeLabels);
    }

    // Update parcel with setbacks and edge labels
    await prisma.parcel.update({
      where: { id: project.parcel.id },
      data: updateData
    });

    console.log('✅ Saved setbacks:', setbacks);
    if (edgeLabels) {
      console.log('✅ Saved edge labels:', edgeLabels);
    }

    return NextResponse.json({
      success: true,
      setbacks,
      edgeLabels: edgeLabels || null
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error saving setbacks:', error);
    return NextResponse.json({ error: 'Failed to save setbacks' }, { status: 500, headers: corsHeaders });
  }
}
