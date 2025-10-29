import { NextRequest, NextResponse } from 'next/server'
import { searchMaricopaParcel } from '@/lib/maricopa'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 })
  }

  const parcelData = await searchMaricopaParcel(address)

  if (!parcelData) {
    return NextResponse.json({ error: 'No parcel found' }, { status: 404 })
  }

  return NextResponse.json(parcelData)
}