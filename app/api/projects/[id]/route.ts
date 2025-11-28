import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        parcel: true,
        engineeringReqs: true,
        tasks: true,
        notes: true,
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)

  } catch (error) {
    console.error('Get project API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    console.log('🔧 PATCH /api/projects/[id] called')
    console.log('   Project ID:', id)
    console.log('   Body:', JSON.stringify(body, null, 2))

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Build update data object with only provided fields
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.status !== undefined) updateData.status = body.status
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.projectNotes !== undefined) updateData.projectNotes = body.projectNotes
    if (body.clientName !== undefined) updateData.clientName = body.clientName
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.archivedAt !== undefined) updateData.archivedAt = body.archivedAt ? new Date(body.archivedAt) : null

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        parcel: true,
        engineeringReqs: true,
        tasks: true,
        notes: true,
      }
    })

    return NextResponse.json(updatedProject)

  } catch (error) {
    console.error('Update project API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
