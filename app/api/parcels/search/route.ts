import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const lowerAddr = address.toLowerCase();
    if (!lowerAddr.includes('phoenix') && !lowerAddr.includes('az')) {
      return NextResponse.json(
        { error: 'Currently only supporting Phoenix, AZ addresses' },
        { status: 400 }
      );
    }

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
      address: parcelData.address,
      city: parcelData.city,
      zip: parcelData.zip,
      lotSizeSqFt: Math.round(parcelData.lotSizeSqFt),
      buildingSqFt: parcelData.buildingSqFt ? Math.round(parcelData.buildingSqFt) : null,
      apn: parcelData.apn,
      zoning: parcelData.zoning || 'R1-6',
    });
  } catch (error) {
    console.error('Error searching parcel:', error);
    return NextResponse.json(
      { error: 'Failed to search property' },
      { status: 500 }
    );
  }
}
