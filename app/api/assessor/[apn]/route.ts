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
    // Fetch residential details via proxy
    const residentialUrl = `${MARICOPA_PROXY}?url=${encodeURIComponent(`https://mcassessor.maricopa.gov/parcel/${cleanApn}/residential-details`)}`;
    console.log('Fetching:', residentialUrl);
    
    const residentialRes = await fetch(residentialUrl);
    const residentialText = await residentialRes.text();
    
    console.log('Response status:', residentialRes.status);
    console.log('Response text (first 500 chars):', residentialText.substring(0, 500));
    
    // Check if it's HTML
    if (residentialText.trim().startsWith('<')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Proxy returned HTML instead of JSON',
        assessorUrl: `https://mcassessor.maricopa.gov/mcs/?q=${cleanApn}&mod=pd`,
      }, { status: 502 });
    }
    
    const residentialData = JSON.parse(residentialText);

    // Fetch valuation data via proxy
    const valuationUrl = `${MARICOPA_PROXY}?url=${encodeURIComponent(`https://mcassessor.maricopa.gov/parcel/${cleanApn}/valuation`)}`;
    const valuationRes = await fetch(valuationUrl);
    const valuationText = await valuationRes.text();
    const valuationData = valuationText.trim().startsWith('<') ? {} : JSON.parse(valuationText);

    const result = {
      success: true,
      parcel: {
        parcelNumber: cleanApn,
        situsStreet1: residentialData?.SitusAddress || residentialData?.PropertyAddress || '',
        situsCity: residentialData?.SitusCity || 'Phoenix',
        situsState: 'AZ',
        situsZip: residentialData?.SitusZip || '',
        propertyClass: residentialData?.PropertyType || 'Residential',
        propertyType: residentialData?.PropertyType || 'Single Family',
        subdivision: residentialData?.SubdivisionName || '',
        schoolDistrict: residentialData?.HighSchoolDistrict || '',
        taxArea: residentialData?.AssessorMarket || '',
        fullCashValue: valuationData?.FullCashValue || 0,
        limitedPropertyValue: valuationData?.LimitedPropertyValue || 0,
        landValue: valuationData?.LandValue || 0,
        improvementValue: valuationData?.ImprovementValue || 0,
        taxYear: valuationData?.TaxYear || new Date().getFullYear(),
        assessedValue: valuationData?.AssessedLimitedValue || 0,
        legalDescription: residentialData?.PropertyDescription || '',
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