import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key'
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
    squareFootage: number
    scopeOfWork: string
    hillsideGrade: boolean
    onSeptic: boolean
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
}) {
  const { projectData, currentRequirements, userMessage, conversationHistory } = params

  // If no API key is set, return a demo response
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key') {
    return {
      response: `Thank you for your question about "${userMessage}". This is a demo response. 

Based on your project details, here are some considerations:
- Your ${projectData.projectType} project in ${projectData.jurisdiction}
- Property type: ${projectData.propertyType}
- Size: ${projectData.squareFootage} sq ft

I would recommend discussing with your local building department for specific requirements. Add your OpenAI API key to get real AI assistance.`,
      updatedRequirements: currentRequirements,
      requirementsChanged: false
    }
  }

  const systemPrompt = `You are a building code and permit expert helping with a construction project. 

PROJECT DETAILS:
- Name: ${projectData.name}
- Type: ${projectData.projectType}
- Property: ${projectData.propertyType}
- Jurisdiction: ${projectData.jurisdiction}
- Size: ${projectData.squareFootage} sq ft
- Hillside: ${projectData.hillsideGrade ? 'Yes' : 'No'}
- Septic: ${projectData.onSeptic ? 'Yes' : 'No'}
- Scope: ${projectData.scopeOfWork}

CURRENT ENGINEERING REQUIREMENTS:
${currentRequirements.map(req => `- ${req.discipline}: ${req.required ? 'Required' : 'Optional'} - ${req.notes}`).join('\n')}

Your role is to:
1. Answer questions about building codes, permits, and engineering requirements
2. Suggest modifications to engineering requirements based on new information
3. Provide practical advice for this specific project and jurisdiction

If the user's question suggests changes to engineering requirements, provide:
1. A helpful response to their question
2. Updated requirements list if changes are needed
3. Explanation of why requirements changed

Respond in JSON format:
{
  "response": "Your helpful answer to the user's question",
  "updatedRequirements": [array of requirements if changes needed, or null if no changes],
  "requirementsChanged": boolean,
  "explanation": "Why requirements changed (if applicable)"
}`

  try {
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory,
      { role: 'user' as const, content: userMessage }
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.3,
      max_tokens: 1500
    })

    const content = response.choices[0].message.content || '{}'
    
    try {
      const aiResponse = JSON.parse(content)
      return {
        response: aiResponse.response || 'I apologize, but I had trouble processing your question.',
        updatedRequirements: aiResponse.updatedRequirements || currentRequirements,
        requirementsChanged: aiResponse.requirementsChanged || false,
        explanation: aiResponse.explanation || null
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      return {
        response: content.replace(/```json|```/g, '').trim(),
        updatedRequirements: currentRequirements,
        requirementsChanged: false
      }
    }
  } catch (error) {
    console.error('Error in AI chat:', error)
    return {
      response: 'I apologize, but I encountered an error processing your question. Please try again.',
      updatedRequirements: currentRequirements,
      requirementsChanged: false
    }
  }
}