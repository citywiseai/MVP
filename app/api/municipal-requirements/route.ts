import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jurisdiction = searchParams.get('jurisdiction')
    const zoning = searchParams.get('zoning')
    const projectType = searchParams.get('projectType')

    if (!jurisdiction) {
      return NextResponse.json(
        { error: 'Jurisdiction is required' },
        { status: 400 }
      )
    }

    // Find the jurisdiction
    const jurisdictionRecord = await prisma.jurisdiction.findFirst({
      where: {
        OR: [
          { name: { equals: jurisdiction, mode: 'insensitive' } },
          { fullName: { contains: jurisdiction, mode: 'insensitive' } }
        ]
      }
    })

    if (!jurisdictionRecord) {
      return NextResponse.json(
        { requirements: [], message: 'Jurisdiction not found in database' },
        { status: 200 }
      )
    }

    // Build query filters
    const where: any = {
      jurisdictionId: jurisdictionRecord.id,
      isActive: true
    }

    // Filter by project type if provided
    if (projectType) {
      where.appliesToProjectTypes = {
        has: projectType
      }
    }

    // Fetch municipal requirements
    const requirements = await prisma.municipalRequirement.findMany({
      where,
      include: {
        rules: {
          where: {
            isActive: true,
            ...(zoning ? {
              zoningCodes: {
                some: {
                  code: { contains: zoning, mode: 'insensitive' }
                }
              }
            } : {})
          },
          orderBy: { priority: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      requirements,
      jurisdiction: jurisdictionRecord.name
    })

  } catch (error) {
    console.error('Error fetching municipal requirements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
