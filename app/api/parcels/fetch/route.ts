import { NextRequest, NextResponse } from 'next/server';
import { searchRegridParcel, getSubdivisionPlat } from '@/lib/regrid';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Parcels fetched successfully' });
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    console.log('🔍 Fetching parcel from Regrid for:', address);

    // Fetch parcel data from Regrid (nationwide coverage!)
    const parcelData = await searchRegridParcel(address);

    if (!parcelData) {
      return NextResponse.json(
        { error: 'Parcel not found' },
        { status: 404 }
      );
    }

    console.log('📦 Parcel data received:', {
      apn: parcelData.apn,
      address: parcelData.address,
      subdivision: parcelData.subdivision,
      platBook: parcelData.platBook,
      platPage: parcelData.platPage
    });

    // Build zoning rules array with subdivision info
    const zoningRules = [];
    
    if (parcelData.subdivision || parcelData.platBook) {
      zoningRules.push({
        type: 'subdivision',
        name: parcelData.subdivision || 'Unknown Subdivision',
        platBook: parcelData.platBook,
        platPage: parcelData.platPage,
        mcrweblink: parcelData.mcrweblink,
        subdivisionId: null
      });
      console.log('✅ Subdivision info found:', zoningRules[0]);
    }

    // Add zoning info if available
    if (parcelData.zoning) {
      zoningRules.push({
        type: 'zoning',
        code: parcelData.zoning,
        name: `Zoning: ${parcelData.zoning}`
      });
    }

    console.log('✅ Creating/updating parcel with APN:', parcelData.apn);

    // Store the COMPLETE raw Regrid API response in propertyMetadata
    // This ensures we don't lose any data fields from Regrid
    const propertyMetadata = parcelData.rawRegridData || {};

    console.log('📊 Storing', Object.keys(propertyMetadata).length, 'Regrid fields in propertyMetadata');

    // Create or update parcel in database
    const parcel = await prisma.parcel.upsert({
      where: { apn: parcelData.apn },
      create: {
        apn: parcelData.apn,
        address: parcelData.address,
        city: parcelData.city,
        state: parcelData.state,
        county: parcelData.county,
        zipCode: parcelData.zip,
        zoning: parcelData.zoning || '',
        lotSizeSqFt: Math.round(parcelData.lotSizeSqFt),
        latitude: parcelData.latitude,
        longitude: parcelData.longitude,
        boundaryCoordinates: parcelData.boundaryRings,
        zoningRules: zoningRules,
        propertyMetadata: propertyMetadata,
      },
      update: {
        address: parcelData.address,
        city: parcelData.city,
        state: parcelData.state,
        county: parcelData.county,
        zipCode: parcelData.zip,
        zoning: parcelData.zoning || '',
        lotSizeSqFt: Math.round(parcelData.lotSizeSqFt),
        latitude: parcelData.latitude,
        longitude: parcelData.longitude,
        boundaryCoordinates: parcelData.boundaryRings,
        zoningRules: zoningRules,
        propertyMetadata: propertyMetadata,
      },
    });

    return NextResponse.json(
      { success: true, parcel, rawData: parcelData },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Parcel fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch parcel data' },
      { status: 500 }
    );
  }
}
