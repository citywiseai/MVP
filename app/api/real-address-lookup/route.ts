import { NextRequest, NextResponse } from 'next/server'
import { searchRegridParcel } from '@/lib/regrid'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    console.log('🏠 API: Checking Regrid for:', address)
    const parcelData = await searchRegridParcel(address)
    
    if (parcelData) {
      console.log('🏠 API: Found Regrid data:', {
        lotSizeSqFt: parcelData.lotSizeSqFt,
        buildingSqFt: parcelData.buildingSqFt,
        jurisdiction: parcelData.city
      })
      
      return NextResponse.json({
        address: `${parcelData.address}, ${parcelData.city}, ${parcelData.zip}`,
        jurisdiction: parcelData.city,
        lotSizeSqFt: parcelData.lotSizeSqFt,
        buildingSqFt: parcelData.buildingSqFt,
        buildingFootprintSqFt: parcelData.buildingSqFt,
        yearBuilt: parcelData.yearBuilt,
        bedrooms: parcelData.bedrooms,
        bathrooms: parcelData.bathrooms,
        propertyType: parcelData.propertyType,
        zoning: parcelData.zoning,
        parcelNumber: parcelData.apn,
        ownerName: parcelData.owner,
        assessedValue: null,
        floodZone: 'X',
        seismicZone: 'Low',
        utilities: {
          water: 'Municipal',
          sewer: 'Municipal',
          gas: 'Available',
          electric: 'Available'
        },
        constraints: []
      })
    }

    return NextResponse.json(
      { error: 'Address not found' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Address lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to lookup address data' },
      { status: 500 }
    )
  }
}
