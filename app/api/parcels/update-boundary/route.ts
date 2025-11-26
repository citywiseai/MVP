import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { parcelId, coordinates } = await request.json()
    if (!parcelId || !coordinates) {
      return NextResponse.json({ error: 'Missing parcelId or coordinates' }, { status: 400 })
    }

    // Update the parcel boundaryCoordinates in the database
    const updated = await prisma.parcel.update({
      where: { id: parcelId },
      data: { boundaryCoordinates: JSON.stringify(coordinates) }
    })

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    console.error('Error updating parcel boundary:', error)
    return NextResponse.json({ error: 'Failed to update boundary' }, { status: 500 })
  }
}
