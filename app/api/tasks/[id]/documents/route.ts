import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { put } from '@vercel/blob';
import { detectDocumentType } from '@/lib/phase-detector';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resolvedParams = await params;

    // Verify task belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id: resolvedParams.id,
        project: {
          ownerId: user.id
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const documents = await prisma.taskDocument.findMany({
      where: { taskId: resolvedParams.id },
      include: {
        uploadedByContact: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resolvedParams = await params;

    // Verify task belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id: resolvedParams.id,
        project: {
          ownerId: user.id
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string;
    const contactId = formData.get('contactId') as string | null;
    const documentType = formData.get('documentType') as string;
    const notes = formData.get('notes') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    });

    // Auto-detect document type if not provided
    const detectedType = documentType || detectDocumentType(file.name);

    // Get latest version number for this document type
    const latestDoc = await prisma.taskDocument.findFirst({
      where: {
        taskId: resolvedParams.id,
        documentType: detectedType as any
      },
      orderBy: { version: 'desc' }
    });

    const version = (latestDoc?.version || 0) + 1;

    const document = await prisma.taskDocument.create({
      data: {
        taskId: resolvedParams.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: blob.url,
        documentType: detectedType as any,
        version,
        revisionNumber: `Rev ${version}`,
        uploadedBy,
        uploadedByContactId: contactId,
        reviewNotes: notes
      }
    });

    // Update task document count
    await prisma.task.update({
      where: { id: resolvedParams.id },
      data: {
        totalDocuments: {
          increment: 1
        },
        pendingDocuments: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
