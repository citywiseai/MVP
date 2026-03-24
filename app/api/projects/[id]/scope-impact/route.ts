import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { getCategoriesForScopes, estimateCostImpact, taskMatchesScope } from '@/lib/scope-mapping';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { removedScopes } = await req.json();

    if (!removedScopes || !Array.isArray(removedScopes) || removedScopes.length === 0) {
      return NextResponse.json({ error: 'Invalid removedScopes' }, { status: 400 });
    }

    // Get all categories that map to the removed scopes
    const categories = getCategoriesForScopes(removedScopes);

    // Find all active tasks that match these categories
    const affectedTasks = await prisma.task.findMany({
      where: {
        projectId: id,
        isActive: true,
        OR: categories.map(category => ({
          category: {
            contains: category,
            mode: 'insensitive'
          }
        }))
      },
      select: {
        id: true,
        title: true,
        category: true,
        description: true
      }
    });

    // Filter tasks to ensure they match (double check with helper function)
    const matchingTasks = affectedTasks.filter(task =>
      taskMatchesScope(task.category, removedScopes)
    );

    // For now, we don't have explicit requirement tracking, so we estimate
    // based on the rule that each scope typically has 2-4 requirements
    // and each requirement generates 1-3 tasks
    const estimatedRequirements = removedScopes.length * 3;

    // Calculate estimated cost decrease
    const estimatedCostDecrease = estimateCostImpact(removedScopes);

    return NextResponse.json({
      totalTasks: matchingTasks.length,
      estimatedRequirements,
      estimatedCostDecrease,
      affectedTasks: matchingTasks.map(t => ({
        id: t.id,
        title: t.title,
        category: t.category
      }))
    });

  } catch (error) {
    console.error('Error calculating scope impact:', error);
    return NextResponse.json(
      { error: 'Failed to calculate impact' },
      { status: 500 }
    );
  }
}
