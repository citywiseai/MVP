import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getChecklist } from './documentChecklists'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key'
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function analyzeZoning(params: {
  address: string
  zoningCode: string
  lotSizeSqFt: number
  zoningRules: Array<{ field: string; value: string; unit: string | null }>
}) {
  // If no API key is set, return a demo response
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key') {
    return `Demo Analysis for ${params.address}:

1. BUILDABLE AREA: Based on ${params.zoningCode} zoning, this ${params.lotSizeSqFt.toLocaleString()} sq ft lot allows for significant development.

2. KEY CONSTRAINTS:
   - Standard setback requirements apply
   - Height limitations per zoning code
   - Lot coverage restrictions

3. DEVELOPMENT RECOMMENDATIONS:
   - Single-family residence: Up to 2,500 sq ft recommended
   - ADU potential: Strong candidate for accessory dwelling unit
   - Consider solar installation for energy efficiency

Note: This is a demo response. Add your OpenAI API key to get real AI analysis.`
  }

  const rulesText = params.zoningRules
    .map(r => `${r.field}: ${r.value} ${r.unit || ''}`)
    .join('\n')

  const prompt = `Analyze this property for development potential:

Address: ${params.address}
Zoning: ${params.zoningCode}
Lot Size: ${params.lotSizeSqFt} sq ft

Current Zoning Rules:
${rulesText}

Provide a clear, practical analysis covering:
1. What can be built (house size, ADU possibilities, building height)
2. Key constraints (setbacks, coverage limits)
3. Development recommendations

Be specific and concise.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    })

    return response.choices[0].message.content || 'Analysis unavailable'
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return 'Unable to generate analysis. Please check your API key and try again.'
  }
}

export async function generateProjectSuggestions(
  parcelData: {
    address: string
    zoningCode: string
    lotSizeSqFt: number
  }
) {
  const prompt = `
Based on this property information:
- Address: ${parcelData.address}
- Zoning: ${parcelData.zoningCode}
- Lot Size: ${parcelData.lotSizeSqFt.toLocaleString()} sq ft

Suggest 3-5 realistic development project ideas that would be appropriate for this property. For each suggestion, include:
- Project type (e.g., single-family home, duplex, commercial building)
- Brief description
- Estimated timeline
- Key permits likely needed

Format as a JSON array with objects containing: type, description, timeline, permits
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a development consultant who suggests realistic, profitable projects based on zoning and lot characteristics. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.4,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return []

    try {
      return JSON.parse(content)
    } catch {
      return []
    }
  } catch (error) {
    console.error('Error generating project suggestions:', error)
    return []
  }
}

export async function estimatePermitTimeline(
  projectType: string,
  jurisdiction: string,
  complexity: 'simple' | 'moderate' | 'complex' = 'moderate'
) {
  const prompt = `
Estimate the permit approval timeline for:
- Project Type: ${projectType}
- Jurisdiction: ${jurisdiction}
- Complexity: ${complexity}

Provide a realistic timeline estimate including:
1. Pre-application phase
2. Permit application submission
3. Review and approval process
4. Potential delays or complications

Keep the response brief and practical.
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a permitting expert familiar with municipal processes across different jurisdictions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.2,
    })

    return completion.choices[0]?.message?.content || "Unable to estimate timeline at this time."
  } catch (error) {
    console.error('Error estimating permit timeline:', error)
    return "Error estimating timeline. Please try again later."
  }
}

export async function checkMunicipalRequirements(params: {
  jurisdiction: string
  projectType: string
  squareFootage: number
  zoningCode: string
}) {
  const prompt = `Review building requirements for this project in ${params.jurisdiction}:

Project Type: ${params.projectType}
Square Footage: ${params.squareFootage}
Zoning: ${params.zoningCode}

List all engineering disciplines and documentation required by ${params.jurisdiction} for permit submission. Include:
- Structural engineering requirements
- MEP (Mechanical, Electrical, Plumbing) requirements  
- Civil engineering requirements (grading, drainage)
- Soils/geotechnical requirements
- Survey requirements
- Any jurisdiction-specific requirements

Be specific to ${params.jurisdiction} regulations.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 700
  })

  return response.choices[0].message.content || 'Unable to verify requirements'
}

export async function analyzeProjectScope(params: {
  projectType: string
  squareFootage: number
  scopeOfWork: string
  propertyType: string
  hillsideGrade: boolean
  onSeptic: boolean
}) {
  // If no API key is set, return comprehensive demo requirements
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key') {
    return [
      {
        "discipline": "Architectural Design",
        "required": true,
        "notes": "Complete architectural plans including floor plans, elevations, sections, and details. Site plan with setbacks and zoning compliance."
      },
      {
        "discipline": "Structural Engineering",
        "required": true,
        "notes": "Foundation design, framing plans, structural calculations, and load analysis. Required for all new construction and major renovations."
      },
      {
        "discipline": "MEP Engineering",
        "required": true,
        "notes": "Mechanical, Electrical, and Plumbing systems design. HVAC load calculations, electrical panel schedules, and plumbing fixture layouts."
      },
      {
        "discipline": "Civil Engineering",
        "required": params.hillsideGrade || params.squareFootage > 3000,
        "notes": params.hillsideGrade ? "Grading, drainage, and erosion control plans required for hillside properties." : "May be required for larger projects or complex site conditions."
      },
      {
        "discipline": "Soils Engineering",
        "required": params.hillsideGrade || params.propertyType === "Commercial",
        "notes": params.hillsideGrade ? "Geotechnical investigation required for hillside construction." : "Recommended for commercial projects or problematic soil conditions."
      },
      {
        "discipline": "Survey Engineering",
        "required": true,
        "notes": "Property boundary survey and topographical survey. Required to verify property lines and existing site conditions."
      },
      {
        "discipline": "Energy Compliance",
        "required": true,
        "notes": "Title 24 energy compliance calculations and documentation. Required for all new construction and major renovations."
      }
    ]
  }

  const prompt = `You are a building department expert analyzing permit requirements. For this construction project, determine ALL required engineering disciplines and municipal documentation:

PROJECT DETAILS:
- Type: ${params.projectType}
- Property: ${params.propertyType}
- Size: ${params.squareFootage} sq ft
- Hillside (>10% grade): ${params.hillsideGrade ? 'Yes' : 'No'}
- Septic System: ${params.onSeptic ? 'Yes' : 'No'}

SCOPE OF WORK:
${params.scopeOfWork}

REQUIRED OUTPUT: List ALL engineering disciplines typically required by municipal building departments for this project type. Include these core disciplines at minimum:

1. Architectural Design (always required)
2. Structural Engineering (foundation, framing, calculations)
3. MEP Engineering (Mechanical, Electrical, Plumbing)
4. Civil Engineering (grading, drainage, utilities)
5. Soils/Geotechnical Engineering (soil investigation)
6. Survey Engineering (boundary and topographical)
7. Energy Compliance (Title 24, energy calculations)

Additional disciplines to consider:
- Fire Protection Engineering (sprinkler systems)
- Traffic Engineering (commercial projects)
- Landscape Architecture (large projects)
- Environmental Review (CEQA compliance)

Return ONLY a JSON array in this exact format:
[
  {
    "discipline": "Architectural Design",
    "required": true,
    "notes": "Complete architectural package including floor plans, elevations, sections, details, and site plan with setbacks."
  },
  {
    "discipline": "Structural Engineering", 
    "required": true,
    "notes": "Foundation design, framing plans, structural calculations for all load-bearing elements."
  }
]

Be comprehensive - most building departments require 5-7 different engineering disciplines for permit approval.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1200
    })

    const content = response.choices[0].message.content || '[]'
    // Extract JSON from response (handle if AI includes extra text)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const requirements = JSON.parse(jsonMatch[0])
      // Ensure we always have comprehensive requirements
      if (requirements.length < 4) {
        console.warn('AI returned insufficient requirements, using fallback')
        return [
          {
            "discipline": "Architectural Design",
            "required": true,
            "notes": "Complete architectural plans including floor plans, elevations, sections, and details."
          },
          {
            "discipline": "Structural Engineering",
            "required": true,
            "notes": "Foundation design, framing plans, and structural calculations."
          },
          {
            "discipline": "MEP Engineering",
            "required": true,
            "notes": "Mechanical, Electrical, and Plumbing systems design and calculations."
          },
          {
            "discipline": "Civil Engineering",
            "required": true,
            "notes": "Site grading, drainage plans, and utility connections."
          },
          {
            "discipline": "Survey Engineering",
            "required": true,
            "notes": "Property boundary and topographical survey."
          }
        ]
      }
      return requirements
    }
    return []
  } catch (error) {
    console.error('Error parsing AI response:', error)
    // Return comprehensive fallback requirements
    return [
      {
        "discipline": "Architectural Design",
        "required": true,
        "notes": "Complete architectural package including floor plans, elevations, sections, and details."
      },
      {
        "discipline": "Structural Engineering",
        "required": true,
        "notes": "Foundation design, framing plans, and structural calculations."
      },
      {
        "discipline": "MEP Engineering",
        "required": true,
        "notes": "Mechanical, Electrical, and Plumbing systems design."
      },
      {
        "discipline": "Civil Engineering",
        "required": true,
        "notes": "Site grading, drainage, and utility plans."
      },
      {
        "discipline": "Survey Engineering",
        "required": true,
        "notes": "Property boundary and topographical survey."
      }
    ]
  }
}

export async function chatWithProjectAI(params: {
  projectData: {
    name: string
    projectType: string
    propertyType: string
    jurisdiction: string
    fullAddress?: string
    description?: string
    squareFootage: number
    scopeOfWork: string
    hillsideGrade: boolean
    onSeptic: boolean
    parcel?: {
      zoning?: string
      lotSizeSqFt?: number
      address?: string
      city?: string
      state?: string
      county?: string
      zoningRules?: any[]
    } | null
    municipalRequirements?: any[]
    phoenixZoning?: any | null
  }
  currentRequirements: Array<{
    discipline: string
    required: boolean
    notes: string
  }>
  userMessage: string
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  permitTimeline?: any
}) {
  const { projectData, currentRequirements, userMessage, conversationHistory, permitTimeline } = params

  console.log('🧠 AI chatWithProjectAI - Called with:')
  console.log('🧠 AI - projectData.phoenixZoning:', projectData?.phoenixZoning)
  console.log('🧠 AI - projectData.jurisdiction:', projectData?.jurisdiction)
  console.log('🧠 AI - projectData.parcel?.zoning:', projectData?.parcel?.zoning)

  // Helper function to build zoning context
  // IMPORTANT: Only show data that exists in database - NO GUESSING OR DEFAULTS
  const buildZoningContext = (zoning: any) => {
    if (!zoning) {
      return 'NO ZONING DATA AVAILABLE IN DATABASE - Cannot provide specific zoning regulations. Recommend contacting Phoenix Planning & Development at (602) 262-7811.'
    }

    // Helper to format values - explicit about what's missing
    const formatValue = (value: any, unit: string = '', defaultText: string = 'NOT IN DATABASE') => {
      if (value === null || value === undefined) {
        return defaultText
      }
      if (typeof value === 'number') {
        return `${value}${unit}`
      }
      return `${value}${unit}`
    }

    // Format percentages explicitly
    const formatPercent = (value: any) => {
      if (value === null || value === undefined) {
        return 'NOT IN DATABASE - verify with city'
      }
      return `${(value * 100).toFixed(0)}%`
    }

    // Calculate open space from lot coverage if lot coverage exists
    const openSpacePercent = zoning.lotCoverageMax !== null && zoning.lotCoverageMax !== undefined
      ? formatPercent(1 - zoning.lotCoverageMax)
      : 'NOT IN DATABASE - verify with city'

    return `

=== VERIFIED PHOENIX ZONING DATA FOR ${zoning.zoningDistrict} ===
Source: CityWise Database (Phoenix Zoning Ordinance Section 622)

SETBACK REQUIREMENTS (VERIFIED):
- Front Setback: ${formatValue(zoning.frontSetback, ' feet')}
- Side Setback: ${formatValue(zoning.sideSetback, ' feet')}
- Rear Setback: ${formatValue(zoning.rearSetback, ' feet')}

HEIGHT LIMITS (VERIFIED):
- Maximum Building Height: ${formatValue(zoning.maxHeight, ' feet')}

LOT COVERAGE (VERIFIED):
- Maximum Lot Coverage: ${formatPercent(zoning.lotCoverageMax)}
- Minimum Open Space Required: ${openSpacePercent}

ADU REGULATIONS (VERIFIED):
- ADUs Allowed: ${zoning.aduAllowed === true ? 'YES' : zoning.aduAllowed === false ? 'NO' : 'NOT IN DATABASE'}
- Maximum Number of ADUs: ${formatValue(zoning.maxADUs, '', 'NOT IN DATABASE')}
- ADU Max Size: ${formatValue(zoning.aduMaxSize, ' sq ft', 'NOT IN DATABASE')}
  (Note: Whichever is LESS: 1,000-1,200 sq ft OR 50% of primary dwelling size)
- ADU Max Height: ${formatValue(zoning.aduMaxHeight, ' feet', 'NOT IN DATABASE')}
  (Note: Whichever is LESS: 30 feet OR height of primary dwelling)
- ADU Min Setback: ${formatValue(zoning.aduMinSetback, ' feet', 'NOT IN DATABASE')}
- ADU Parking Required: NO - Phoenix does not require additional parking for ADUs (as of 2024)

NOTE: Values marked "NOT IN DATABASE" require verification with Phoenix Planning & Development.
Contact: (602) 262-7811 or planning.development@phoenix.gov
`
  }

  // Helper function to build permit timeline context
  const buildPermitTimelineContext = (timeline: any): string => {
    if (!timeline) return '\nNO PERMIT TIMELINE DATA AVAILABLE - Recommend contacting the city planning department for current processing times.';

    const totalDays = timeline.planReviewDays +
      (timeline.revisionDays * timeline.typicalRevisions) +
      timeline.approvalDays;
    const totalWeeks = Math.ceil(totalDays / 5);

    return `

=== PERMIT TIMELINE ESTIMATE ===
Jurisdiction: ${timeline.jurisdiction.toUpperCase()}
Project Type: ${timeline.permitType.replace(/_/g, ' ').toUpperCase()}

TIMELINE (Business Days):
- Initial Plan Review: ${timeline.planReviewDays} days
- Revision Cycles: ${timeline.typicalRevisions} typical (${timeline.revisionDays} days each)
- Final Approval: ${timeline.approvalDays} days
- Inspection Lead Time: ${timeline.inspectionDays} days
- ESTIMATED TOTAL: ${totalWeeks} weeks (${totalDays} business days)

PERMIT FEES:
- Base Fee: $${timeline.baseFee}
- Per Square Foot: $${timeline.feePerSqFt}/sqft
${timeline.expeditedAvailable
      ? `- Expedited Review: Available for +$${timeline.expeditedFee}`
      : '- Expedited Review: Not available in this jurisdiction'}

NOTES: ${timeline.notes || 'None'}

NOTE: These are typical timeframes. Actual processing may vary based on project complexity and current workload.
`;
  };

  // Helper function to build document checklist context
  const buildDocumentChecklistContext = (projectType: string): string => {
    // Determine project type from scope
    const scope = projectData.scopeOfWork?.toLowerCase() || projectData.description?.toLowerCase() || '';
    let checklistType = 'ADDITION';

    if (scope.includes('adu')) {
      checklistType = 'ADU';
    } else if (scope.includes('new construction') || scope.includes('new home')) {
      checklistType = 'NEW_CONSTRUCTION';
    } else if (scope.includes('remodel')) {
      checklistType = 'REMODEL';
    }

    const checklist = getChecklist(checklistType);
    if (!checklist) return '\nNo document checklist available for this project type.';

    let context = `\n=== DOCUMENT CHECKLIST FOR ${checklistType.replace(/_/g, ' ')} ===\n`;

    context += '\nREQUIRED DOCUMENTS:\n';
    checklist.required.forEach((doc, i) => {
      context += `${i + 1}. ${doc.name} - ${doc.description}\n`;
    });

    if (checklist.conditional.length > 0) {
      context += '\nCONDITIONAL DOCUMENTS (may be required):\n';
      checklist.conditional.forEach((doc, i) => {
        context += `${i + 1}. ${doc.name} - ${doc.description}\n   (Required if: ${doc.condition})\n`;
      });
    }

    context += '\nAT PROJECT COMPLETION:\n';
    checklist.atCompletion.forEach((doc, i) => {
      context += `${i + 1}. ${doc.name} - ${doc.description}\n`;
    });

    return context;
  };

  // Build parcel context
  let parcelContext = ''
  if (projectData.parcel) {
    parcelContext = `
PROPERTY & ZONING DETAILS:
- Address: ${projectData.fullAddress || projectData.parcel.address || 'Not specified'}
- Zoning Code: ${projectData.parcel.zoning || 'Not specified'}
- Lot Size: ${projectData.parcel.lotSizeSqFt ? `${projectData.parcel.lotSizeSqFt.toLocaleString()} sq ft` : 'Not specified'}
- City: ${projectData.parcel.city || 'Not specified'}
- County: ${projectData.parcel.county || 'Not specified'}`

    if (projectData.parcel.zoningRules && Array.isArray(projectData.parcel.zoningRules)) {
      const rules = projectData.parcel.zoningRules.map((r: any) =>
        `  - ${r.field}: ${r.value} ${r.unit || ''}`
      ).join('\n')
      if (rules) {
        parcelContext += `\n\nZONING RULES:\n${rules}`
      }
    }
  }

  // Build Phoenix zoning context
  const phoenixZoningContext = projectData.phoenixZoning ? buildZoningContext(projectData.phoenixZoning) : ''

  console.log('🧠 AI - Built phoenixZoningContext:', phoenixZoningContext ? 'YES (length: ' + phoenixZoningContext.length + ')' : 'EMPTY')
  if (phoenixZoningContext) {
    console.log('🧠 AI - Zoning context preview:', phoenixZoningContext.substring(0, 200))
  }

  // Build permit timeline context
  const timelineContext = buildPermitTimelineContext(permitTimeline)
  console.log('🧠 AI - Built timelineContext:', timelineContext ? 'YES' : 'EMPTY')

  // Build document checklist context
  const checklistContext = buildDocumentChecklistContext(projectData.projectType)
  console.log('🧠 AI - Built checklistContext:', checklistContext ? 'YES' : 'EMPTY')

  // Build municipal requirements context
  let municipalContext = ''
  if (projectData.municipalRequirements && projectData.municipalRequirements.length > 0) {
    municipalContext = `\n\nMUNICIPAL REQUIREMENTS DATABASE (${projectData.jurisdiction}):\n`
    municipalContext += projectData.municipalRequirements.map((req: any) =>
      `- ${req.name}: ${req.description}${req.typicalTimeframe ? ` (Typical timeframe: ${req.typicalTimeframe})` : ''}`
    ).join('\n')
  }

  // As-Built documentation context
  const asBuiltContext = `

AS-BUILT DRAWINGS REQUIREMENT:
As-built drawings are REQUIRED by ${projectData.jurisdiction || 'Phoenix'} for permit closeout and certificate of occupancy.

What Are As-Built Drawings?
- Revised blueprints showing the project exactly as constructed (not as originally designed)
- Must include all field changes and modifications made during construction
- Document final dimensions, geometry, and location of all elements
- Show any material substitutions from original plans
- Include updated electrical, plumbing, and structural details

Why Required?
- Required for permit closeout and final inspection approval
- Needed for certificate of occupancy
- Creates accurate record for future reference and renovations
- Ensures municipal records reflect actual construction

Who Prepares Them?
- Typically prepared by the contractor or project architect
- Based on field measurements and construction documentation
- Must be stamped/signed by licensed professional (if required by jurisdiction)

Timeline:
- Prepared upon project completion (typically 1-2 weeks after construction)
- Submitted before final inspection
- Must be approved before certificate of occupancy is issued

Important Notes:
- Required for ALL construction projects (additions, ADUs, remodels, new construction)
- Must show actual conditions, not original design intent
- Digital and/or paper copies may be required
- Part of project closeout documentation package`

  const systemPrompt = `You are Scout, an expert building code and zoning advisor for ${projectData.jurisdiction || 'the local jurisdiction'}. You provide accurate, specific guidance based on actual zoning regulations and municipal requirements.

PROJECT DETAILS:
- Project Name: ${projectData.name}
- Project Type: ${projectData.projectType}
- Property Type: ${projectData.propertyType}
- Jurisdiction: ${projectData.jurisdiction}
- Size: ${projectData.squareFootage || 0} sq ft
- Hillside Property: ${projectData.hillsideGrade ? 'Yes' : 'No'}
- Septic System: ${projectData.onSeptic ? 'Yes' : 'No'}
- Scope of Work: ${projectData.scopeOfWork || projectData.description || 'Not specified'}
${parcelContext}${phoenixZoningContext}${municipalContext}${asBuiltContext}${timelineContext}${checklistContext}

CURRENT ENGINEERING REQUIREMENTS:
${currentRequirements.map(req => `- ${req.discipline}: ${req.required ? 'Required' : 'Optional'} - ${req.notes}`).join('\n')}

YOUR ROLE:
You are Scout, a zoning and permit assistant that provides VERIFIED information from the CityWise database. Your primary responsibility is accuracy - never guess or use general knowledge for zoning regulations.

CRITICAL RULES - ABSOLUTELY NO EXCEPTIONS:
1. ONLY provide information explicitly stated in the verified data sections above
2. If a value shows "NOT IN DATABASE" or "NOT AVAILABLE" - tell the user it's not available and recommend verification
3. NEVER estimate, guess, or use general knowledge about zoning regulations, timelines, or fees
4. NEVER use values that aren't explicitly shown in the verified data above
5. Always cite the specific jurisdiction and data source

WHEN ANSWERING QUESTIONS:
- Lot Coverage: ONLY use the exact percentage from "Maximum Lot Coverage" above - if it says "NOT IN DATABASE", tell the user
- Setbacks: ONLY use the exact feet from "Front/Side/Rear Setback" above - if missing, tell the user
- Heights: ONLY use the exact feet from "Maximum Building Height" above - if missing, tell the user
- ADUs: ONLY use values from "ADU REGULATIONS" section above - if missing, tell the user
- Permit Timeline: ONLY use the exact weeks/days from "PERMIT TIMELINE ESTIMATE" above - if missing, tell the user
- Permit Fees: ONLY use the exact fees from "PERMIT FEES" section - calculate total based on base fee + (sqft × per sqft fee)
- Documents: ONLY list documents from "DOCUMENT CHECKLIST" section - separate required vs conditional clearly
- Expedited Review: ONLY state availability if explicitly shown in timeline data

IF DATA IS MISSING:
Respond: "I don't have verified data for [specific item] in our database. For accurate information, please contact Phoenix Planning & Development at (602) 262-7811 or planning.development@phoenix.gov"

CORRECT RESPONSE EXAMPLE:
User: "What's my max lot coverage?"
You: "For your R1-10 zoned property, the maximum lot coverage is 40% with a minimum of 60% open space required."

INCORRECT RESPONSE EXAMPLE (NEVER DO THIS):
User: "What's my max lot coverage?"
You: "For R1-10 zoning, it's typically 50%..." ❌ WRONG - this is a hallucination!

Always be helpful, but prioritize accuracy over being helpful. If you don't have the data, say so clearly.`

  try {
    // Build conversation history for Claude
    const messages: Array<{ role: 'user' | 'assistant', content: string }> = []

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      })
    })

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''

    return {
      response: content || 'I apologize, but I had trouble processing your question.',
      updatedRequirements: currentRequirements,
      requirementsChanged: false
    }
  } catch (error) {
    console.error('Error in Claude chat:', error)
    return {
      response: 'I apologize, but I encountered an error processing your question. Please try again.',
      updatedRequirements: currentRequirements,
      requirementsChanged: false
    }
  }
}