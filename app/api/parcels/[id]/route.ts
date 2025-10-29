import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/lib/auth'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { boundaryCoordinates } = await request.json()

    const parcel = await prisma.parcel.update({
      where: { id: params.id },
      data: {
        boundaryCoordinates: boundaryCoordinates
      }
    })

    return NextResponse.json({ success: true, parcel })
  } catch (error) {
    console.error('Error updating parcel:', error)
    return NextResponse.json({ error: 'Failed to update parcel' }, { status: 500 })
  }
}
