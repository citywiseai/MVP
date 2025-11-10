import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Fetch from Regrid
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/parcels/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: project.fullAddress }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch parcel data' }, { status: 500 });
    }

    const parcelData = await response.json();

    let parcel;

    // If project already has a parcel, update it
    if (project.parcel) {
      parcel = await prisma.parcel.update({
        where: { id: project.parcel.id },
        data: {
          apn: parcelData.apn || '',
          address: parcelData.address,
          city: parcelData.city,
          state: parcelData.state || 'AZ',
          zipCode: parcelData.zip,
          zoning: parcelData.zoning,
          lotSizeSqFt: parcelData.lotSizeSqFt,
          latitude: parcelData.latitude,
          longitude: parcelData.longitude,
          boundaryCoordinates: parcelData.boundaryCoordinates,
          existingSqFt: parcelData.buildingSqFt,
        }
      });
    } else {
      // Check if parcel with this APN exists
      parcel = await prisma.parcel.findUnique({
        where: { apn: parcelData.apn || '' }
      });

      if (parcel) {
        // Update existing parcel
        parcel = await prisma.parcel.update({
          where: { id: parcel.id },
          data: {
            address: parcelData.address,
            city: parcelData.city,
            state: parcelData.state || 'AZ',
            zipCode: parcelData.zip,
            zoning: parcelData.zoning,
            lotSizeSqFt: parcelData.lotSizeSqFt,
            latitude: parcelData.latitude,
            longitude: parcelData.longitude,
            boundaryCoordinates: parcelData.boundaryCoordinates,
            existingSqFt: parcelData.buildingSqFt,
          }
        });
      } else {
        // Create new parcel
        parcel = await prisma.parcel.create({
          data: {
            apn: parcelData.apn || '',
            address: parcelData.address,
            city: parcelData.city,
            state: parcelData.state || 'AZ',
            zipCode: parcelData.zip,
            zoning: parcelData.zoning,
            lotSizeSqFt: parcelData.lotSizeSqFt,
            latitude: parcelData.latitude,
            longitude: parcelData.longitude,
            boundaryCoordinates: parcelData.boundaryCoordinates,
            existingSqFt: parcelData.buildingSqFt,
          }
        });
      }

      // Link to project
      await prisma.project.update({
        where: { id },
        data: { parcelId: parcel.id }
      });
    }

    return NextResponse.json({ success: true, parcel });
  } catch (error) {
    console.error('Error fetching parcel:', error);
    return NextResponse.json({ error: 'Failed to fetch parcel' }, { status: 500 });
  }
}
