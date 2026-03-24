import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchRegridParcel } from '@/lib/regrid';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get project
    const project = await prisma.project.findUnique({
      where: { id },
      include: { parcel: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // No address to fetch
    if (!project.fullAddress) {
      return NextResponse.json({ error: 'No address to fetch' }, { status: 400 });
    }

    console.log('🔍 Fetching parcel from Regrid for:', project.fullAddress);

    // Fetch parcel data directly from Regrid
    const parcelData = await searchRegridParcel(project.fullAddress);

    if (!parcelData) {
      return NextResponse.json({ error: 'Parcel not found in Regrid' }, { status: 404 });
    }

    console.log('📦 Parcel data received:', {
      apn: parcelData.apn,
      address: parcelData.address,
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
    }

    if (parcelData.zoning) {
      zoningRules.push({
        type: 'zoning',
        code: parcelData.zoning,
        name: `Zoning: ${parcelData.zoning}`
      });
    }

    // Store complete Regrid data
    const propertyMetadata = parcelData.rawRegridData || {};

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
        lotSizeSqFt: Math.round(parcelData.lotSizeSqFt || 0),
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
        lotSizeSqFt: Math.round(parcelData.lotSizeSqFt || 0),
        latitude: parcelData.latitude,
        longitude: parcelData.longitude,
        boundaryCoordinates: parcelData.boundaryRings,
        zoningRules: zoningRules,
        propertyMetadata: propertyMetadata,
      },
    });

    // Link the parcel to the project if not already linked
    if (!project.parcelId || project.parcelId !== parcel.id) {
      await prisma.project.update({
        where: { id },
        data: { parcelId: parcel.id }
      });
    }

    console.log('✅ Parcel linked to project:', parcel.id);

    return NextResponse.json({ success: true, parcel });
  } catch (error: any) {
    console.error('Error fetching parcel:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch parcel' }, { status: 500 });
  }
}