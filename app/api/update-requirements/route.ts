import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('Update requirements API called')
    
    // Temporarily bypass auth for testing - matching project page behavior
    // const session = await auth()
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    // Mock session for testing (use real user ID)
    const session = {
      user: {
        id: 'cmgjqv72q0000bths4f4h0x0w',
        email: 'demo@rezio.dev'
      }
    }

    const body = await request.json()
    console.log('Received body:', JSON.stringify(body, null, 2))
    
    const { projectId, requirements } = body

    if (!projectId || !requirements) {
      console.log('Missing required fields:', { projectId: !!projectId, requirements: !!requirements })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get all existing requirements for this project
    const existingReqs = await prisma.engineeringRequirement.findMany({
      where: { projectId }
    })

    // Convert requirements to array format if it's an object
    let requirementsArray: any[];
    if (Array.isArray(requirements)) {
      requirementsArray = requirements;
    } else if (typeof requirements === 'object' && requirements !== null) {
      requirementsArray = Object.entries(requirements).map(([discipline, value]) => {
        return `${discipline}: ${value}`;
      });
    } else {
      throw new Error('Invalid requirements format');
    }

    // Only add new requirements if not present and not custom
    let createdCount = 0;
    for (const [index, req] of requirementsArray.entries()) {
      let discipline, required, notes, requirement;
      if (typeof req === 'string') {
        const match = req.match(/^([^:]+):\s*(Required|Optional|Not Required)(?:\s*-\s*(.*))?$/);
        if (match) {
          discipline = match[1].trim();
          required = match[2] === 'Required';
          notes = match[3] ? match[3].trim() : '';
          requirement = req;
        } else {
          discipline = req.trim();
          required = false;
          notes = '';
          requirement = req;
        }
      } else {
        discipline = req.discipline;
        required = req.required;
        notes = req.notes || '';
        requirement = req.requirement || `${discipline}: ${required ? 'Required' : 'Optional'} - ${notes}`;
      }

      // Check if a custom requirement for this discipline already exists
      const alreadyExists = existingReqs.find(r => r.discipline === discipline);
      if (!alreadyExists) {
        await prisma.engineeringRequirement.create({
          data: {
            id: `req_${Date.now()}_${index}`,
            projectId,
            discipline,
            required,
            notes,
            requirement,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        createdCount++;
      }
    }
    console.log(`Requirements updated successfully. AI added: ${createdCount}`)
    
    // Update tasks based on the new requirements
    console.log('Updating tasks based on new requirements...')
    
    // First, remove existing requirement-based tasks
    await prisma.task.deleteMany({
      where: {
        projectId,
        title: {
          contains: 'Requirements'
        }
      }
    })
    
    // Get the newly created required engineering requirements
    const requiredRequirements = await prisma.engineeringRequirement.findMany({
      where: { 
        projectId,
        required: true
      }
    })
    
    console.log('Found required requirements for tasks:', requiredRequirements.length)
    
    // Create tasks for each required requirement
    if (requiredRequirements.length > 0) {
      for (const req of requiredRequirements) {
        const taskTitle = `Complete ${req.discipline} Requirements`
        
        await prisma.task.create({
          data: {
            title: taskTitle,
            description: req.notes || `Complete all ${req.discipline} requirements for the project`,
            projectId,
            // Note: Using demo user since auth is bypassed
            userId: 'cmgjqv72q0000bths4f4h0x0w',
          }
        })
      }
      
      console.log(`Created ${requiredRequirements.length} tasks from requirements`)
    }
    
    // Revalidate the project page to show updated requirements and tasks
    revalidatePath(`/projects/${projectId}`)
    
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Update requirements API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}