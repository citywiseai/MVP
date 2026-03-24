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
    const code = searchParams.get('code')
    const jurisdiction = searchParams.get('jurisdiction')?.toLowerCase() || 'phoenix'

    if (!code) {
      return NextResponse.json(
        { error: 'Zoning code is required' },
        { status: 400 }
      )
    }

    console.log(`🏛️ Fetching zoning: ${code} for jurisdiction: ${jurisdiction}`)

    // Query zoning table filtered by jurisdiction
    const zoning = await prisma.phoenixZoning.findFirst({
      where: {
        zoningDistrict: {
          equals: code,
          mode: 'insensitive'
        },
        jurisdiction: {
          equals: jurisdiction,
          mode: 'insensitive'
        }
      }
    })

    if (!zoning) {
      console.log(`⚠️ No zoning data found for ${jurisdiction} - ${code}`)
      return NextResponse.json(
        { zoning: null, message: `No zoning data found for ${code} in ${jurisdiction}` },
        { status: 200 }
      )
    }

    console.log(`✅ Found zoning data for ${jurisdiction} - ${code}`)
    return NextResponse.json({ zoning })

  } catch (error) {
    console.error('Error fetching zoning:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
