import { NextRequest, NextResponse } from 'next/server'
import { chatWithProjectAI } from '@/lib/ai'
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth'



export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const body = await request.json()
    const { projectData, currentRequirements, userMessage, conversationHistory, projectId, permitTimeline } = body

    console.log('🤖 Scout API - Received request')
    console.log('🤖 Scout API - Body keys:', Object.keys(body))
    console.log('🤖 Scout API - projectData keys:', Object.keys(projectData || {}))
    console.log('🤖 Scout API - projectData.phoenixZoning:', projectData?.phoenixZoning)
    console.log('🤖 Scout API - projectData.parcel:', projectData?.parcel)
    console.log('🤖 Scout API - permitTimeline:', permitTimeline)

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
      conversationHistory: conversationHistory || [],
      permitTimeline
    })

    // Save the chat messages to database (both user and assistant)
    let savedUserMessage = null
    let savedAssistantMessage = null

    if (session?.user) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email! }
        })

        if (user) {
          // Save user message
          savedUserMessage = await prisma.chatMessage.create({
            data: {
              content: userMessage,
              role: 'user',
              projectId,
              userId: user.id
            }
          })

          // Save assistant response
          savedAssistantMessage = await prisma.chatMessage.create({
            data: {
              content: result.response,
              role: 'assistant',
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

    return NextResponse.json({
      ...result,
      savedMessages: {
        user: savedUserMessage ? { id: savedUserMessage.id, content: savedUserMessage.content, createdAt: savedUserMessage.createdAt } : null,
        assistant: savedAssistantMessage ? { id: savedAssistantMessage.id, content: savedAssistantMessage.content, createdAt: savedAssistantMessage.createdAt } : null
      }
    })

  } catch (error) {
    console.error('Project chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}