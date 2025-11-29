import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all AI visualizations for a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('📋 GET /visualizations - Starting');

  const session = await auth();
  console.log('🔐 Session:', { hasUser: !!session?.user, userId: session?.user?.id });

  if (!session?.user) {
    console.log('❌ Unauthorized - no session');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: projectId } = await params;
    console.log('📁 Project ID:', projectId);

    console.log('🔍 Fetching visualizations from database...');
    const visualizations = await prisma.projectFile.findMany({
      where: {
        projectId,
        fileType: 'ai-visualization',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        metadata: true,
        createdAt: true,
      },
    });

    console.log('✅ Found visualizations:', visualizations.length);

    return NextResponse.json({ visualizations });
  } catch (error) {
    console.error('❌ Error fetching visualizations:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to fetch visualizations' },
      { status: 500 }
    );
  }
}

// POST - Save a new AI visualization
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🎨 POST /visualizations - Starting');

  const session = await auth();
  console.log('🔐 Session:', { hasUser: !!session?.user, userId: session?.user?.id });

  if (!session?.user?.id) {
    console.log('❌ Unauthorized - no session or user ID');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: projectId } = await params;
    console.log('📁 Project ID:', projectId);

    const body = await req.json();
    console.log('📦 Request body keys:', Object.keys(body));
    console.log('📦 Has imageData:', !!body.imageData);
    console.log('📦 Has prompt:', !!body.prompt);
    console.log('📦 imageData length:', body.imageData?.length);

    const { imageData, prompt } = body;

    if (!imageData) {
      console.log('❌ No imageData provided');
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Create filename with timestamp
    const timestamp = Date.now();
    const fileName = `ai-viz-${timestamp}.png`;
    console.log('📝 Generated filename:', fileName);

    // Save to database
    console.log('💾 Attempting to save to database...');
    const visualization = await prisma.projectFile.create({
      data: {
        projectId,
        fileName,
        fileUrl: imageData, // Base64 data URL
        fileType: 'ai-visualization',
        uploadedBy: session.user.id,
        metadata: prompt ? { prompt } : null,
      },
    });

    console.log('✅ Saved AI visualization:', visualization.id);

    return NextResponse.json({
      success: true,
      visualization: {
        id: visualization.id,
        fileName: visualization.fileName,
        fileUrl: visualization.fileUrl,
        metadata: visualization.metadata,
        createdAt: visualization.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Error saving visualization:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to save visualization' },
      { status: 500 }
    );
  }
}

// PATCH - Update a visualization (rename)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('✏️ PATCH /visualizations - Starting');

  const session = await auth();
  console.log('🔐 Session:', { hasUser: !!session?.user, userId: session?.user?.id });

  if (!session?.user) {
    console.log('❌ Unauthorized - no session');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: projectId } = await params;
    console.log('📁 Project ID:', projectId);

    const body = await req.json();
    const { fileId, fileName } = body;
    console.log('📝 Request data:', { fileId, fileName });

    if (!fileId || !fileName) {
      console.log('❌ Missing required fields:', { hasFileId: !!fileId, hasFileName: !!fileName });
      return NextResponse.json(
        { error: 'File ID and file name are required' },
        { status: 400 }
      );
    }

    console.log('💾 Updating visualization in database...');
    const updatedFile = await prisma.projectFile.update({
      where: {
        id: fileId,
        projectId, // Ensure file belongs to this project
      },
      data: {
        fileName,
      },
    });

    console.log('✅ Renamed AI visualization:', fileId, 'to', fileName);

    return NextResponse.json({
      success: true,
      visualization: {
        id: updatedFile.id,
        fileName: updatedFile.fileName,
        fileUrl: updatedFile.fileUrl,
        metadata: updatedFile.metadata,
        createdAt: updatedFile.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Error renaming visualization:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to rename visualization' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a visualization
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🗑️ DELETE /visualizations - Starting');

  const session = await auth();
  console.log('🔐 Session:', { hasUser: !!session?.user, userId: session?.user?.id });

  if (!session?.user) {
    console.log('❌ Unauthorized - no session');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: projectId } = await params;
    console.log('📁 Project ID:', projectId);

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');
    console.log('📝 File ID to delete:', fileId);

    if (!fileId) {
      console.log('❌ Missing fileId parameter');
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    console.log('💾 Deleting visualization from database...');
    await prisma.projectFile.delete({
      where: {
        id: fileId,
        projectId, // Ensure file belongs to this project
      },
    });

    console.log('✅ Deleted AI visualization:', fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting visualization:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to delete visualization' },
      { status: 500 }
    );
  }
}
