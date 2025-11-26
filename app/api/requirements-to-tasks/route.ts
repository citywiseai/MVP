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
  const { projectId } = body

  const requirements = await prisma.engineeringRequirement.findMany({
    where: { 
      projectId,
      required: true 
    }
  })

  const createdTasks = []

  for (const req of requirements) {
    const existingTask = await prisma.task.findFirst({
      where: {
        projectId,
        title: {
          contains: req.discipline || 'Engineering'
        }
      }
    })
    
    if (!existingTask) {
      const task = await prisma.task.create({
        data: {
          projectId,
          title: `Complete ${req.discipline}`,
          description: req.notes || undefined,
          userId: user.id,
          status: 'TODO',
        }
      })
      createdTasks.push(task)
    }
  }

  return NextResponse.json({ created: createdTasks.length })
}
