import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { messages, userInput, context } = await req.json()

    const systemPrompt = `You are Scout, an expert AI assistant for preconstruction planning in Phoenix, Arizona.

CONTEXT:
- Property: ${context.address}
- Lot Size: ${context.lotSize} sq ft
- Existing Building: ${context.existingBuilding || 'None'} sq ft
- Jurisdiction: ${context.jurisdiction}
- Zoning: ${context.zoning}

Current conversation:
${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

User input: ${userInput}

YOUR TASK: Ask ONE question at a time to understand the project scope.

IMPORTANT: Review the conversation above. If a question has already been answered, move to the next question. DO NOT ask the same question twice.

KEY QUESTIONS (in order, skip if already answered):
1. What type of work? (Addition, Remodel, ADU, New Build - can select multiple)
2. How large is the addition? (if doing addition)
3. Are you moving or removing walls? (if remodeling)
4. What plumbing work? (bathroom and/or kitchen - separate buttons, can select multiple)
5. Electrical panel upgrade needed?
6. How large is the ADU? (if doing ADU)
7. What's going in the ADU? (bathroom, kitchen, bedroom - separate buttons, can select multiple)

After gathering enough information (4-6 answered questions), say: "I've identified all your requirements. When you're ready, I'll create tasks for all the permits and documents you'll need."

Then offer the "Let's get started!" button to create the project.

CRITICAL: You MUST respond with ONLY valid JSON in this EXACT format:

{
  "message": "Your question or response here",
  "buttons": [
    {"label": "Option 1", "value": "option1"},
    {"label": "Option 2", "value": "option2"}
  ],
  "readyToCreate": false
}

For project type question:
{
  "message": "What type of work are you planning? (You can select multiple)",
  "buttons": [
    {"label": "Addition", "value": "addition"},
    {"label": "Remodel", "value": "remodel"},
    {"label": "ADU", "value": "adu"},
    {"label": "New Build", "value": "new_build"}
  ],
  "readyToCreate": false
}

For plumbing question:
{
  "message": "What plumbing work is planned? (You can select multiple)",
  "buttons": [
    {"label": "Adding bathroom(s)", "value": "bathroom_yes"},
    {"label": "Adding/remodeling kitchen", "value": "kitchen_yes"},
    {"label": "No plumbing work", "value": "plumbing_no"}
  ],
  "readyToCreate": false
}

For ADU size question:
{
  "message": "How large is the ADU you're planning?",
  "buttons": [
    {"label": "Under 500 sq ft", "value": "adu_under_500"},
    {"label": "500-1000 sq ft", "value": "adu_500_1000"},
    {"label": "Over 1000 sq ft", "value": "adu_over_1000"}
  ],
  "readyToCreate": false
}

For ADU contents question:
{
  "message": "What will be in your ADU? (You can select multiple)",
  "buttons": [
    {"label": "Bathroom", "value": "adu_bathroom"},
    {"label": "Kitchen", "value": "adu_kitchen"},
    {"label": "Bedroom(s)", "value": "adu_bedroom"},
    {"label": "Living space only", "value": "adu_living"}
  ],
  "readyToCreate": false
}

When ready to create (after gathering enough info):
{
  "message": "I've identified all your requirements. When you're ready, I'll create tasks for all the permits and documents you'll need.",
  "buttons": [
    {"label": "Let's get started!", "value": "create"}
  ],
  "readyToCreate": false
}

RESPOND WITH VALID JSON ONLY. NO OTHER TEXT.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: systemPrompt
        }
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      let jsonText = content.text.trim()
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      
      try {
        const parsed = JSON.parse(jsonText)
        
        if (!parsed.buttons) {
          parsed.buttons = []
        }
        
        if (parsed.readyToCreate === undefined) {
          parsed.readyToCreate = false
        }
        
        return NextResponse.json(parsed)
      } catch (error) {
        console.error('JSON parse error:', error)
        console.error('Raw response:', jsonText)
        
        return NextResponse.json({
          message: "I'm having trouble formatting my response. Can you try asking your question again?",
          buttons: [],
          readyToCreate: false
        })
      }
    }

    return NextResponse.json({ 
      message: "I'm having trouble processing that. Can you try again?",
      buttons: [],
      readyToCreate: false
    })
    
  } catch (error) {
    console.error('Error in smart-scout:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
