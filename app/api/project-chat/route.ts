import { NextRequest, NextResponse } from 'next/server'
import { chatWithProjectAI } from '@/lib/ai'
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth'



export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()
    const { projectData, currentRequirements, userMessage, conversationHistory, projectId } = body

    if (!projectData || !currentRequirements || !userMessage || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await chatWithProjectAI({
      projectData,
      currentRequirements,
      userMessage,
      conversationHistory: conversationHistory || []
    })

    // Save the chat message to database
    if (session?.user) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email! }
        })

        if (user) {
          await prisma.chatMessage.create({
            data: {
              message: userMessage,
              response: result.response,
              role: 'user',
              projectId,
              userId: user.id
            }
          })
        }
      } catch (dbError) {
        console.error('Error saving chat message:', dbError)
        // Don't fail the request if we can't save to DB
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Project chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}