import { NextRequest, NextResponse } from 'next/server';

const MARICOPA_PROXY = 'https://maricopa-proxy.reziopro.workers.dev';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apn: string }> }
) {
  const { apn } = await params;

  if (!apn) {
    return NextResponse.json({ error: 'APN is required' }, { status: 400 });
  }

  const cleanApn = apn.replace(/[-\s]/g, '');

  try {
    // Fetch property info via proxy (has address)
    const propertyUrl = `${MARICOPA_PROXY}?url=${encodeURIComponent(`https://mcassessor.maricopa.gov/parcel/${cleanApn}/propertyinfo`)}`;
    const propertyRes = await fetch(propertyUrl);
    const propertyText = await propertyRes.text();
    const propertyData = propertyText.trim().startsWith('<') ? {} : JSON.parse(propertyText);

    // Fetch residential details via proxy
    const residentialUrl = `${MARICOPA_PROXY}?url=${encodeURIComponent(`https://mcassessor.maricopa.gov/parcel/${cleanApn}/residential-details`)}`;
    const residentialRes = await fetch(residentialUrl);
    const residentialText = await residentialRes.text();
    const residentialData = residentialText.trim().startsWith('<') ? {} : JSON.parse(residentialText);

    // Fetch valuation data via proxy
    const valuationUrl = `${MARICOPA_PROXY}?url=${encodeURIComponent(`https://mcassessor.maricopa.gov/parcel/${cleanApn}/valuation`)}`;
    const valuationRes = await fetch(valuationUrl);
    const valuationText = await valuationRes.text();
    const valuationData = valuationText.trim().startsWith('<') ? {} : JSON.parse(valuationText);

    // Parse address from PropertyAddress field (e.g., "1223 E SHEENA DR PHOENIX, AZ 85022")
    const fullAddress = propertyData?.PropertyAddress || '';
    const addressMatch = fullAddress.match(/^(.+?)\s+(PHOENIX|SCOTTSDALE|TEMPE|MESA|CHANDLER|GLENDALE|GILBERT|PEORIA|SURPRISE|AVONDALE|GOODYEAR|BUCKEYE|CAVE CREEK|CAREFREE|FOUNTAIN HILLS|PARADISE VALLEY),?\s*AZ\s*(\d{5})?/i);
    const streetAddress = addressMatch ? addressMatch[1].trim() : fullAddress;
    const city = addressMatch ? addressMatch[2] : 'Phoenix';
    const zip = addressMatch ? addressMatch[3] || '' : '';

    const result = {
      success: true,
      parcel: {
        parcelNumber: cleanApn,
        situsStreet1: streetAddress,
        situsCity: city,
        situsState: 'AZ',
        situsZip: zip,
        propertyClass: propertyData?.PropertyType || 'Residential',
        propertyType: propertyData?.PropertyType || 'Single Family',
        subdivision: propertyData?.SubdivisionName || '',
        schoolDistrict: propertyData?.HighSchoolDistrict || '',
        taxArea: residentialData?.AssessorMarket || '',
        fullCashValue: valuationData?.FullCashValue || 0,
        limitedPropertyValue: valuationData?.LimitedPropertyValue || 0,
        landValue: valuationData?.LandValue || 0,
        improvementValue: valuationData?.ImprovementValue || 0,
        taxYear: valuationData?.TaxYear || new Date().getFullYear(),
        assessedValue: valuationData?.AssessedLimitedValue || 0,
        legalDescription: propertyData?.PropertyDescription || '',
        lotSize: parseInt(residentialData?.LotSize) || 0,
        lotSizeAcres: residentialData?.LotSize ? (parseInt(residentialData.LotSize) / 43560).toFixed(3) : 0,
        zoning: '',
      },
      residential: {
        livingArea: parseInt(residentialData?.LivableSpace) || 0,
        yearBuilt: parseInt(residentialData?.ConstructionYear) || 0,
        bedrooms: 0,
        bathrooms: residentialData?.BathFixtures ? Math.floor(parseInt(residentialData.BathFixtures) / 3) : 0,
        stories: 1,
        garageSpaces: parseInt(residentialData?.NumberOfGarages) || 0,
        pool: residentialData?.Pool || false,
      },
      valuation: valuationData || [],
      assessorUrl: `https://mcassessor.maricopa.gov/mcs/?q=${cleanApn}&mod=pd`,
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Assessor API error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      assessorUrl: `https://mcassessor.maricopa.gov/mcs/?q=${cleanApn}&mod=pd`,
    }, { status: 500 });
  }
}