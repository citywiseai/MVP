
import { NextRequest, NextResponse } from 'next/server'
import { searchRegridParcel } from '@/lib/regrid'
import { detectJurisdictionWithFallback } from '@/lib/municipal-data'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const address = body.address
    
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }
    
    console.log('🏠 API: Checking Regrid for:', address)
    const parcelData = await searchRegridParcel(address)
    
    if (parcelData) {
      // Detect jurisdiction with county fallback support
      const jurisdictionResult = detectJurisdictionWithFallback(
        parcelData.city,
        parcelData.county
      )

      console.log('🏠 API: Found Regrid data:', {
        lotSizeSqFt: parcelData.lotSizeSqFt,
        buildingSqFt: parcelData.buildingSqFt,
        city: parcelData.city,
        county: parcelData.county,
        jurisdiction: jurisdictionResult.displayName,
        jurisdictionType: jurisdictionResult.type,
        jurisdictionCode: jurisdictionResult.jurisdiction,
        hasGeometry: !!parcelData.boundaryCoordinates
      })

      return NextResponse.json({
        address: `${parcelData.address}, ${parcelData.city}, ${parcelData.zip}`,
        jurisdiction: jurisdictionResult.displayName,
        jurisdictionType: jurisdictionResult.type,
        jurisdictionCode: jurisdictionResult.jurisdiction,
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
        constraints: [],
        geometry: {
          type: 'Polygon',
          coordinates: parcelData.boundaryRings
        },
        latitude: parcelData.latitude,
        longitude: parcelData.longitude,
        apn: parcelData.apn
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
