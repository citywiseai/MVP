import { auth } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

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
  const { projectId, content } = body

  if (!projectId || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const note = await prisma.note.create({
    data: {
      projectId,
      content,
      userId: user.id,
    }
  })

  return NextResponse.json(note)
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const noteId = searchParams.get('noteId')

  if (!noteId) {
    return NextResponse.json({ error: 'Missing noteId' }, { status: 400 })
  }

  await prisma.note.delete({
    where: { id: noteId }
  })

  return NextResponse.json({ success: true })
}
