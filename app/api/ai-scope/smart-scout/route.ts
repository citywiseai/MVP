import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  getZoningByCode,
  isADUAllowed,
  getProjectRequirements,
  getSmartHint,
  type ZoningDistrict
} from '@/lib/municipal-data/phoenix'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Helper function to fetch Phoenix-specific zoning requirements
function getMunicipalRequirements(zoningCode: string): ZoningDistrict | null {
  try {
    console.log('🔍 getMunicipalRequirements called with:', { zoningCode })

    const zoningData = getZoningByCode(zoningCode)

    if (zoningData) {
      console.log('✅ Found Phoenix zoning data for', zoningCode)
      console.log('📋 Zoning:', zoningData.name)
      console.log('📏 Setbacks:', zoningData.setbacks)
      console.log('🏠 ADU Allowed:', zoningData.adu.allowed)
    } else {
      console.log('❌ No Phoenix zoning data found for', zoningCode)
    }

    return zoningData
  } catch (error) {
    console.error('❌ Error fetching municipal requirements:', error)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userInput, context } = await req.json()

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 SCOUT REQUEST RECEIVED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📍 Address:', context.address)
    console.log('🏘️  Zoning Code:', context.zoning, '(type:', typeof context.zoning, ')')
    console.log('🏛️  Jurisdiction:', context.jurisdiction, '(type:', typeof context.jurisdiction, ')')
    console.log('📏 Lot Size:', context.lotSize)
    console.log('🏗️  Existing Building:', context.existingBuilding || 'None')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Fetch Phoenix-specific zoning requirements
    let zoningContext = ''
    let zoningData: ZoningDistrict | null = null

    if (context.zoning) {
      console.log('✅ Context has zoning code - fetching Phoenix zoning data...')
      try {
        zoningData = getMunicipalRequirements(context.zoning)

        if (zoningData) {
          console.log('✅ Phoenix zoning data found for', zoningData.code)

          // Build comprehensive natural language zoning context
          zoningContext = `\n\nPHOENIX ZONING REQUIREMENTS - ${zoningData.code} (${zoningData.name}):\n\n`

          zoningContext += `SETBACKS:\n`
          zoningContext += `- Front: ${zoningData.setbacks.front} feet\n`
          zoningContext += `- Side: ${zoningData.setbacks.side} feet\n`
          zoningContext += `- Rear: ${zoningData.setbacks.rear} feet\n`
          if (zoningData.setbacks.streetSide) {
            zoningContext += `- Street side (corner lot): ${zoningData.setbacks.streetSide} feet\n`
          }
          zoningContext += `\n`

          zoningContext += `LOT REQUIREMENTS:\n`
          zoningContext += `- Minimum lot size: ${zoningData.minLotSize.toLocaleString()} sq ft\n`
          zoningContext += `- Maximum lot coverage: ${zoningData.maxLotCoverage}%\n`
          zoningContext += `- Maximum building height: ${zoningData.maxBuildingHeight} feet\n\n`

          // Check ADU eligibility for this specific lot
          const aduCheck = isADUAllowed(zoningData, context.lotSize)

          zoningContext += `ADU REGULATIONS:\n`
          if (aduCheck.allowed) {
            zoningContext += `- ADUs permitted: Yes\n`
            zoningContext += `- Maximum ADU size: ${zoningData.adu.maxSizeSqFt} sq ft\n`
            if (zoningData.adu.maxHeight) {
              zoningContext += `- Maximum ADU height: ${zoningData.adu.maxHeight} feet\n`
            }
            zoningContext += `- ADU setbacks - Front: ${zoningData.adu.setbacks.front}', Rear: ${zoningData.adu.setbacks.rear}', Side: ${zoningData.adu.setbacks.side}'\n`
            zoningContext += `- Parking required: ${zoningData.adu.parking} space(s)\n`
            if (zoningData.adu.notes && zoningData.adu.notes.length > 0) {
              zoningContext += `- Notes: ${zoningData.adu.notes.join('; ')}\n`
            }
          } else {
            zoningContext += `- ADUs: ${aduCheck.reason}\n`
          }

          zoningContext += `\nPOOL REQUIREMENTS:\n`
          zoningContext += `- Setback from property line: ${zoningData.pool.setbackFromProperty} feet\n`
          zoningContext += `- Setback from house: ${zoningData.pool.setbackFromHouse} feet\n`
          if (zoningData.pool.requiresFence) {
            zoningContext += `- Fence required: Yes, ${zoningData.pool.fenceHeight} feet minimum height\n`
          }

          zoningContext += `\nGARAGE/ACCESSORY STRUCTURES:\n`
          zoningContext += `- Front setback: ${zoningData.garage.setbackFront} feet\n`
          zoningContext += `- Side setback: ${zoningData.garage.setbackSide} feet\n`
          zoningContext += `- Rear setback: ${zoningData.garage.setbackRear} feet\n`
          zoningContext += `- Maximum height (detached): ${zoningData.garage.maxHeightDetached} feet\n\n`

          zoningContext += `PERMIT THRESHOLDS:\n`
          zoningContext += `- Structures under ${zoningData.permits.buildingExemptUnder} sq ft may not require building permit\n`
          zoningContext += `- Electrical work: ${zoningData.permits.electricalAlwaysRequired ? 'Always requires permit' : 'May be exempt for minor work'}\n`
          zoningContext += `- Plumbing work: ${zoningData.permits.plumbingAlwaysRequired ? 'Always requires permit' : 'May be exempt for minor work'}\n`

          if (zoningData.notes && zoningData.notes.length > 0) {
            zoningContext += `\nADDITIONAL NOTES:\n${zoningData.notes.map(n => `- ${n}`).join('\n')}\n`
          }

          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('✅ PHOENIX ZONING CONTEXT BUILT')
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log(zoningContext)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        } else {
          console.log('❌ No Phoenix zoning data found for', context.zoning)
        }
      } catch (error) {
        console.error('❌ ERROR FETCHING PHOENIX ZONING:', error)
      }
    } else {
      console.log('⚠️ Skipping zoning fetch - missing zoning code')
    }

    const systemPrompt = `You are Scout, an expert AI assistant for preconstruction planning in Phoenix, Arizona.

CONTEXT:
- Property: ${context.address}
- Lot Size: ${context.lotSize} sq ft
- Existing Building: ${context.existingBuilding || 'None'} sq ft
- Jurisdiction: ${context.jurisdiction}
- Zoning: ${context.zoning}${zoningContext}

Current conversation:
${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

User input: ${userInput}

YOUR TASK: Ask ONE question at a time to understand the project scope.

ZONING GUIDANCE:
${zoningContext ? `- You have comprehensive Phoenix zoning information available above. Use it naturally when relevant to the conversation.
- When user mentions ADU: Reference ADU-specific rules (max size, height, setbacks, how many allowed)
- When discussing building additions: Mention setback requirements and lot coverage limits
- When talking about parking: Cite the specific parking requirements for their zone
- Sound like a knowledgeable local expert, not reading from a rulebook
- Examples:
  * "In your ${context.zoning} zone, ADUs can be up to [size] square feet"
  * "You'll need to keep [setback] feet from the property line"
  * "Your zone allows up to [coverage]% lot coverage, so you have room to expand"
  * "Good news - your zone permits up to [number] ADUs"
- NEVER dump all zoning rules at once - only mention rules relevant to what they're planning
- If they mention special situations, reference the special rules when applicable` : '- No zoning information available yet. Continue with project questions.'}

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

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📨 SENDING TO CLAUDE API')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Zoning context included:', zoningContext ? 'YES ✅' : 'NO ❌')
    if (zoningContext) {
      console.log('📏 Zoning context length:', zoningContext.length, 'characters')
    }
    console.log('📊 Total system prompt length:', systemPrompt.length, 'characters')
    console.log('💬 User input:', userInput)
    console.log('📝 Conversation messages count:', messages.length)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

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

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📥 RECEIVED RESPONSE FROM CLAUDE')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📄 Raw response (first 300 chars):')
      console.log(jsonText.substring(0, 300) + (jsonText.length > 300 ? '...' : ''))
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

      try {
        const parsed = JSON.parse(jsonText)

        if (!parsed.buttons) {
          parsed.buttons = []
        }

        if (parsed.readyToCreate === undefined) {
          parsed.readyToCreate = false
        }

        console.log('✅ JSON parsed successfully')
        console.log('💬 Scout message:', parsed.message.substring(0, 150) + (parsed.message.length > 150 ? '...' : ''))
        console.log('🔘 Button count:', parsed.buttons.length)
        if (parsed.buttons.length > 0) {
          console.log('   Buttons:', parsed.buttons.map((b: any) => b.label).join(', '))
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        return NextResponse.json(parsed)
      } catch (error) {
        console.error('❌ JSON parse error:', error)
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
    console.error('❌ ERROR in smart-scout:', error)
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
