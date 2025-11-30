import { auth } from "@/lib/auth"
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from "next/server"



export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const body = await request.json()
  const { projectId, title, description, priority, assignedTo, phaseId } = body

  if (!projectId || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      description: description || null,
      status: 'TODO',
      priority: priority || 'MEDIUM',
      assignedTo: assignedTo || null,
      phaseId: phaseId || null,
    }
  })

  return NextResponse.json(task)
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { taskId, status, priority, assignedTo, phaseId } = body

  if (!taskId) {
    return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
  }

  const updateData: any = {}

  if (status !== undefined) {
    updateData.status = status
    updateData.lastStatusChange = new Date()
  }
  if (priority !== undefined) updateData.priority = priority
  if (assignedTo !== undefined) updateData.assignedTo = assignedTo
  if (phaseId !== undefined) updateData.phaseId = phaseId

  const task = await prisma.task.update({
    where: { id: taskId },
    data: updateData
  })

  return NextResponse.json(task)
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')

  if (!taskId) {
    return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
  }

  await prisma.task.delete({
    where: { id: taskId }
  })

  return NextResponse.json({ success: true })
}
