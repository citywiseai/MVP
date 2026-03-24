import { NextRequest, NextResponse } from 'next/server';
import { createDefaultRoadmap } from '@/lib/create-default-roadmap';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    console.log('📋 Checking for existing roadmap for project:', resolvedParams.id);

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: resolvedParams.id,
        ownerId: session.user.id
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if roadmap already exists
    const existingRoadmap = await prisma.projectRoadmap.findFirst({
      where: { projectId: resolvedParams.id }
    });

    if (existingRoadmap) {
      console.log('✅ Found existing roadmap:', existingRoadmap.id);
      console.log('📊 Phases:', (existingRoadmap.phases as any[]).map((p: any) => p.id).join(', '));
    }

    // Check if existing roadmap has old phase IDs that need migration
    const hasOldPhaseIds = existingRoadmap?.phases &&
      (existingRoadmap.phases as any[]).some((p: any) =>
        ['permit-prep', 'permitting', 'final'].includes(p.id)
      );

    // If roadmap exists and doesn't need migration, return it
    if (existingRoadmap && !hasOldPhaseIds) {
      console.log('✅ Roadmap is up to date, returning it');
      return NextResponse.json({
        roadmap: existingRoadmap,
        message: 'Roadmap already exists'
      });
    }

    // Delete old roadmap if it exists (for migration)
    if (existingRoadmap) {
      console.log('🔄 Migrating roadmap with old phase IDs...');
      await prisma.projectRoadmap.delete({
        where: { id: existingRoadmap.id }
      });
    }

    // Create new default roadmap
    console.log('🔨 Creating new roadmap...');
    const roadmap = await createDefaultRoadmap(resolvedParams.id);
    console.log('✅ Roadmap created:', roadmap.id);
    console.log('📊 New phases:', (roadmap.phases as any[]).map((p: any) => p.id).join(', '));

    return NextResponse.json({
      roadmap,
      message: 'Roadmap created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error generating roadmap:', error);
    return NextResponse.json({ error: 'Failed to generate roadmap' }, { status: 500 });
  }
}
