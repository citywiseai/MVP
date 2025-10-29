import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/lib/auth'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete related data in the correct order to avoid foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete engineering requirements
      await tx.engineeringRequirement.deleteMany({
        where: { projectId: id }
      })

      // Delete project files
      await tx.projectFile.deleteMany({
        where: { projectId: id }
      })

      // Delete notes
      await tx.note.deleteMany({
        where: { projectId: id }
      })

      // Delete tasks
      await tx.task.deleteMany({
        where: { projectId: id }
      })

      // Finally delete the project
      await tx.project.delete({
        where: { id }
      })
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete project API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}