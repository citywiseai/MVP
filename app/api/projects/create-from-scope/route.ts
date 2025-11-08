import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {  PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'

const prisma = new PrismaClient()

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { parcelData, conversation } = await req.json()

    // Use AI to extract structured project data from conversation
    const extractionPrompt = `Based on this conversation, extract project details as JSON:

Conversation:
${conversation}

Property Info:
- Address: ${parcelData.address}
- Lot Size: ${parcelData.lotSizeSqFt} sq ft
- Existing Building: ${parcelData.existingSqFt || 'None'} sq ft
- Jurisdiction: ${parcelData.jurisdiction}
- Zoning: ${parcelData.zoning}

Extract:
{
  "projectType": "Addition|Remodel|New Build|Pool|ADU|Other",
  "description": "Brief description of the work",
  "scopeOfWork": "Detailed scope including all systems mentioned",
  "squareFootage": number (estimated if not mentioned),
  "engineeringNeeds": {
    "structural": boolean,
    "civil": boolean,
    "electrical": boolean,
    "plumbing": boolean,
    "mechanical": boolean
  },
  "keyDetails": {
    "movingWalls": boolean,
    "panelUpgrade": boolean,
    "plumbingRelocation": boolean,
    "hvacWork": boolean
  }
}

Respond with JSON only.`

    const extraction = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: extractionPrompt }],
    })

    const content = extraction.content[0]
    if (content.type !== 'text') {
      throw new Error('Failed to extract project data')
    }

    let projectData
    try {
      projectData = JSON.parse(content.text)
    } catch {
      throw new Error('Failed to parse project data')
    }

    // Get or create user's default org
    let org = await prisma.org.findFirst({
      where: { memberships: { some: { userId: session.user.id } } }
    })

    if (!org) {
      org = await prisma.org.create({
        data: {
          name: `${session.user.name || session.user.email}'s Organization`,
          memberships: {
            create: {
              userId: session.user.id,
              role: 'admin'
            }
          }
        }
      })
    }

    // Create or get parcel
    let parcel = await prisma.parcel.findUnique({
      where: { apn: parcelData.apn }
    })

    if (!parcel) {
      parcel = await prisma.parcel.create({
        data: {
          apn: parcelData.apn,
          address: parcelData.address,
          city: parcelData.jurisdiction,
          state: 'AZ',
          zipCode: parcelData.address.match(/\d{5}/)?.[0] || '',
          county: 'Maricopa',
          zoning: parcelData.zoning,
          lotSizeSqFt: parcelData.lotSizeSqFt,
          existingSqFt: parcelData.existingSqFt,
        }
      })
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name: `${projectData.projectType} at ${parcelData.address}`,
        fullAddress: parcelData.address,
        propertyType: 'Residential',
        projectType: projectData.projectType,
        description: projectData.description,
        scopeOfWork: projectData.scopeOfWork,
        buildingFootprintSqFt: projectData.squareFootage,
        totalSfModified: projectData.squareFootage,
        orgId: org.id,
        ownerId: session.user.id,
        parcelId: parcel.id,
      }
    })

    // Create engineering requirements based on needs
    const requirements = []
    
    if (projectData.engineeringNeeds.structural) {
      requirements.push({
        projectId: project.id,
        discipline: 'Structural',
        required: true,
        notes: projectData.keyDetails.movingWalls 
          ? 'Required for wall modifications and load analysis'
          : 'Required for structural analysis'
      })
    }

    if (projectData.engineeringNeeds.electrical) {
      requirements.push({
        projectId: project.id,
        discipline: 'Electrical',
        required: true,
        notes: projectData.keyDetails.panelUpgrade
          ? 'Panel upgrade and load calculations required'
          : 'Electrical design and calculations required'
      })
    }

    if (projectData.engineeringNeeds.plumbing) {
      requirements.push({
        projectId: project.id,
        discipline: 'Plumbing',
        required: true,
        notes: projectData.keyDetails.plumbingRelocation
          ? 'Plumbing relocations and fixture design'
          : 'Plumbing design required'
      })
    }

    if (projectData.engineeringNeeds.mechanical) {
      requirements.push({
        projectId: project.id,
        discipline: 'Mechanical',
        required: true,
        notes: 'HVAC design and load calculations'
      })
    }

    if (projectData.engineeringNeeds.civil) {
      requirements.push({
        projectId: project.id,
        discipline: 'Civil',
        required: true,
        notes: 'Site grading and drainage design'
      })
    }

    if (requirements.length > 0) {
      await prisma.engineeringRequirement.createMany({
        data: requirements
      })
    }

    // Create initial note with conversation summary
    await prisma.note.create({
      data: {
        projectId: project.id,
        authorId: session.user.id,
        content: `Project created from AI Scope Capture.\n\nScope Summary:\n${projectData.description}\n\nKey Details:\n${projectData.scopeOfWork}`
      }
    })

    return NextResponse.json({ 
      projectId: project.id,
      success: true 
    })

  } catch (error) {
    console.error('Error creating project from scope:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
