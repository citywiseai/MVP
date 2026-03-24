import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth'

// PATCH - Edit a message
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, messageId } = await params
    const { content } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Verify user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        org: {
          include: {
            memberships: {
              where: {
                user: {
                  email: session.user.email!
                }
              }
            }
          }
        }
      }
    })

    if (!project || project.org.memberships.length === 0) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // Update the message
    const updatedMessage = await prisma.chatMessage.update({
      where: {
        id: messageId,
        projectId: projectId  // Ensure message belongs to this project
      },
      data: { content: content.trim() },
    })

    return NextResponse.json(updatedMessage)

  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, messageId } = await params

    // Verify user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        org: {
          include: {
            memberships: {
              where: {
                user: {
                  email: session.user.email!
                }
              }
            }
          }
        }
      }
    })

    if (!project || project.org.memberships.length === 0) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // Delete the message
    await prisma.chatMessage.delete({
      where: {
        id: messageId,
        projectId: projectId  // Ensure message belongs to this project
      },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}
