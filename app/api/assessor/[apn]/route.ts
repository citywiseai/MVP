import { NextRequest, NextResponse } from 'next/server';

const MARICOPA_API_TOKEN = 'dcedf0d8-a1b8-433f-a078-fc6e8abaec5a';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;

  console.log('=== ASSESSOR API CALLED ===');
  console.log('APN:', apn);

  if (!apn) {
    return NextResponse.json({ error: 'APN is required' }, { status: 400 });
  }

  const cleanApn = apn.replace(/[-\s]/g, '');

  // For now, return mock data to test the route works
  // We'll add the real API call once we confirm the route is working

  const mockData = {
    success: true,
    parcel: {
      parcelNumber: cleanApn,
      situsStreet1: '2537 E Mercer Ln',
      situsCity: 'Phoenix',
      situsState: 'AZ',
      situsZip: '85028',
      propertyClass: 'Residential',
      propertyType: 'Single Family',
      subdivision: 'Paradise Valley Ranchos',
      schoolDistrict: 'Phoenix Union High School District',
      taxArea: '10-010',
      fullCashValue: 485000,
      limitedPropertyValue: 412000,
      landValue: 145000,
      improvementValue: 340000,
      taxYear: 2024,
      assessedValue: 412000,
      legalDescription: 'LOT 45, PARADISE VALLEY RANCHOS UNIT 3',
      lotSize: 10297,
      lotSizeAcres: 0.236,
      zoning: 'R1-10',
    },
    residential: {
      livingArea: 1955,
      yearBuilt: 1985,
      bedrooms: 3,
      bathrooms: 2,
      stories: 1,
      garageSpaces: 2,
      pool: false,
    },
    valuation: [
      { taxYear: 2024, fullCashValue: 485000 },
      { taxYear: 2023, fullCashValue: 462000 },
      { taxYear: 2022, fullCashValue: 398000 },
      { taxYear: 2021, fullCashValue: 342000 },
      { taxYear: 2020, fullCashValue: 328000 },
    ],
  };

  console.log('✅ Returning mock data for APN:', cleanApn);
  return NextResponse.json(mockData);
}
