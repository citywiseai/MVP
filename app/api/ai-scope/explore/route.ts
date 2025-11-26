import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { messages, userInput, conversationId } = await req.json()

    console.log('🔍 EXPLORATION MODE - General Q&A Request')
    console.log('User input:', userInput)
    console.log('Conversation ID:', conversationId)

    // Build comprehensive system prompt for general Phoenix zoning Q&A
    const systemPrompt = `You are Scout, an expert AI assistant for Phoenix, Arizona zoning and building regulations.

MODE: EXPLORATION - You're answering general zoning questions. The user has NOT started a project yet.

YOUR ROLE:
- Answer any questions about Phoenix zoning districts, requirements, and regulations
- Help users understand ADU rules, setbacks, lot coverage, parking requirements, etc.
- Provide accurate information from the Phoenix municipal code
- Be friendly and conversational but precise about regulations
- When relevant, suggest they start a project to get personalized guidance

AVAILABLE PHOENIX ZONING DISTRICTS:
We have detailed information for 21 Phoenix residential zoning districts including:
- Estate Residential: RE-43, RE-24, RE-35
- Single-Family: R1-18, R1-14, R1-10, R1-8, R1-6
- Multifamily: R-2, R-3, R-3A, R-4, R-4A, R-5
- Special Residential: R-I (Infill), R-O (Office)
- Suburban: S-1, S-2
- High-Rise: H-R, H-R1, UR

EXAMPLE QUESTIONS YOU CAN ANSWER:
- "What zones allow ADUs?" → All R1 zones, RE zones, R-I, UR
- "What are setbacks for R1-6?" → 20 ft front, 5 ft side, 15 ft rear
- "Can I build an ADU in RE-43?" → Yes, up to 3 ADUs (if one qualifies as affordable)
- "What's the difference between R1-6 and R1-8?" → Lot size minimums and dimensional requirements
- "What zones allow multifamily?" → R-2 through R-5, R-I, UR
- "What's the max ADU size in R1-6?" → 1,000 sq ft

Current conversation:
${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

User question: ${userInput}

RESPONSE FORMAT:
- If the user asks about a specific zone, provide detailed requirements
- If the user asks which zones allow something, list the relevant zones
- If the question requires knowing their specific property, suggest they enter their address to start a project
- Keep responses concise but informative
- Use natural language, avoid jargon when possible
- If you don't have specific information, be honest about limitations

Respond naturally as if you're having a helpful conversation about Phoenix zoning.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: systemPrompt
        }
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const scoutMessage = content.text.trim()

      // Save or update conversation
      const messageHistory = [
        ...messages,
        { role: 'user', content: userInput },
        { role: 'assistant', content: scoutMessage }
      ]

      if (conversationId) {
        await prisma.explorationConversation.update({
          where: { id: conversationId },
          data: {
            messages: messageHistory,
            updatedAt: new Date()
          }
        })
      } else {
        const newConversation = await prisma.explorationConversation.create({
          data: {
            messages: messageHistory
          }
        })
        return NextResponse.json({
          message: scoutMessage,
          conversationId: newConversation.id
        })
      }

      return NextResponse.json({
        message: scoutMessage,
        conversationId
      })
    }

    return NextResponse.json({
      message: "I'm having trouble processing that. Can you try asking your question again?",
      conversationId
    })

  } catch (error) {
    console.error('❌ ERROR in exploration mode:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
