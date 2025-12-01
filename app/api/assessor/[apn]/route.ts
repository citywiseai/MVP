import { NextRequest, NextResponse } from 'next/server';

const MARICOPA_API_BASE = 'https://mcassessor.maricopa.gov/file/General';

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

  try {
    // Fetch parcel data from Maricopa County API
    const parcelUrl = `${MARICOPA_API_BASE}/parcel?parcel=${cleanApn}`;
    console.log('Fetching parcel data from:', parcelUrl);
    
    const parcelResponse = await fetch(parcelUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!parcelResponse.ok) {
      console.error('Parcel API error:', parcelResponse.status);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to fetch parcel data: ${parcelResponse.status}` 
      }, { status: 500 });
    }

    const parcelData = await parcelResponse.json();
    console.log('Parcel data received:', JSON.stringify(parcelData).substring(0, 500));

    // Fetch residential data
    const resUrl = `${MARICOPA_API_BASE}/res?parcel=${cleanApn}`;
    let residentialData = null;
    
    try {
      const resResponse = await fetch(resUrl, {
        headers: { 'Accept': 'application/json' },
      });
      if (resResponse.ok) {
        residentialData = await resResponse.json();
      }
    } catch (e) {
      console.log('No residential data available');
    }

    // Fetch valuation history
    const valUrl = `${MARICOPA_API_BASE}/valuation?parcel=${cleanApn}`;
    let valuationData = null;
    
    try {
      const valResponse = await fetch(valUrl, {
        headers: { 'Accept': 'application/json' },
      });
      if (valResponse.ok) {
        valuationData = await valResponse.json();
      }
    } catch (e) {
      console.log('No valuation data available');
    }

    // Build response from the actual data
    const response = {
      success: true,
      parcel: {
        parcelNumber: cleanApn,
        situsStreet1: parcelData?.SitusAddress || parcelData?.SITUS_ADDRESS || parcelData?.situs_address || '',
        situsCity: parcelData?.SitusCity || parcelData?.SITUS_CITY || parcelData?.situs_city || '',
        situsState: 'AZ',
        situsZip: parcelData?.SitusZip || parcelData?.SITUS_ZIP || parcelData?.situs_zip || '',
        propertyClass: parcelData?.PropertyClass || parcelData?.PROPERTY_CLASS || 'Residential',
        propertyType: parcelData?.PropertyType || parcelData?.PROPERTY_TYPE || '',
        subdivision: parcelData?.Subdivision || parcelData?.SUBDIVISION || '',
        schoolDistrict: parcelData?.SchoolDistrict || parcelData?.SCHOOL_DISTRICT || '',
        taxArea: parcelData?.TaxArea || parcelData?.TAX_AREA || '',
        fullCashValue: parcelData?.FullCashValue || parcelData?.FCV || 0,
        limitedPropertyValue: parcelData?.LimitedPropertyValue || parcelData?.LPV || 0,
        landValue: parcelData?.LandValue || parcelData?.LAND_VALUE || 0,
        improvementValue: parcelData?.ImprovementValue || parcelData?.IMPROVEMENT_VALUE || 0,
        taxYear: parcelData?.TaxYear || parcelData?.TAX_YEAR || new Date().getFullYear(),
        assessedValue: parcelData?.AssessedValue || parcelData?.ASSESSED_VALUE || 0,
        legalDescription: parcelData?.LegalDescription || parcelData?.LEGAL_DESCRIPTION || '',
        lotSize: parcelData?.LotSqFt || parcelData?.LOT_SQFT || 0,
        lotSizeAcres: parcelData?.LotAcres || parcelData?.LOT_ACRES || 0,
        zoning: parcelData?.Zoning || parcelData?.ZONING || '',
      },
      residential: residentialData ? {
        livingArea: residentialData?.LivingArea || residentialData?.LIVING_AREA || 0,
        yearBuilt: residentialData?.YearBuilt || residentialData?.YEAR_BUILT || 0,
        bedrooms: residentialData?.Bedrooms || residentialData?.BEDROOMS || 0,
        bathrooms: residentialData?.Bathrooms || residentialData?.BATHROOMS || 0,
        stories: residentialData?.Stories || residentialData?.STORIES || 1,
        garageSpaces: residentialData?.GarageSpaces || residentialData?.GARAGE_SPACES || 0,
        pool: residentialData?.Pool || residentialData?.POOL || false,
      } : null,
      valuation: valuationData || [],
      _raw: {
        parcel: parcelData,
        residential: residentialData,
        valuation: valuationData,
      },
    };

    console.log('✅ Returning data for APN:', cleanApn);
    console.log('Address:', response.parcel.situsStreet1);
    
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Error fetching assessor data:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch assessor data' 
    }, { status: 500 });
  }
}