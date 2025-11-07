import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    
    // Check if Phoenix address
    if (!address.toLowerCase().includes('phoenix') && !address.toLowerCase().includes('az')) {
      return NextResponse.json(
        { error: 'Currently only supporting Phoenix, AZ addresses' },
        { status: 400 }
      );
    }

    // Fetch from Regrid
    const { getMaricopaParcelByAddress } = await import('@/lib/regrid');
    const streetAddress = address.split(',')[0].trim();
    const parcelData = await getMaricopaParcelByAddress(streetAddress);

    if (!parcelData) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      address: `${parcelData.address}, ${parcelData.city}, AZ ${parcelData.zip}`,
      jurisdiction: parcelData.city,
      lotSizeSqFt: Math.round(parcelData.lotSizeSqFt),
      apn: parcelData.apn,
      zoning: 'R1-6',
    });
  } catch (error) {
    console.error('Error searching parcel:', error);
    return NextResponse.json(
      { error: 'Failed to search property' },
      { status: 500 }
    );
  }
}
