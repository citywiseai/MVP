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
    // Fetch property info via proxy
    const propertyUrl = `${MARICOPA_PROXY}?url=${encodeURIComponent(`https://mcassessor.maricopa.gov/file/home/propertyinfo?parcel=${cleanApn}`)}`;
    const propertyRes = await fetch(propertyUrl);
    const propertyInfo = await propertyRes.json();

    // Fetch residential data via proxy
    const residentialUrl = `${MARICOPA_PROXY}?url=${encodeURIComponent(`https://mcassessor.maricopa.gov/file/home/residential?parcel=${cleanApn}`)}`;
    const residentialRes = await fetch(residentialUrl);
    const residentialData = await residentialRes.json();

    // Fetch valuation data via proxy
    const valuationUrl = `${MARICOPA_PROXY}?url=${encodeURIComponent(`https://mcassessor.maricopa.gov/file/home/valuation?parcel=${cleanApn}`)}`;
    const valuationRes = await fetch(valuationUrl);
    const valuationData = await valuationRes.json();

    const result = {
      success: true,
      parcel: {
        parcelNumber: cleanApn,
        situsStreet1: propertyInfo?.PropertyAddress?.split(' PHOENIX')?.[0] || '',
        situsCity: 'Phoenix',
        situsState: 'AZ',
        situsZip: propertyInfo?.PropertyAddress?.match(/\d{5}$/)?.[0] || '',
        propertyClass: propertyInfo?.PropertyType || 'Residential',
        propertyType: propertyInfo?.PropertyType || 'Single Family',
        subdivision: propertyInfo?.SubdivisionName || '',
        schoolDistrict: propertyInfo?.HighSchoolDistrict || '',
        taxArea: propertyInfo?.AssessorMarket || '',
        fullCashValue: valuationData?.FullCashValue || 0,
        limitedPropertyValue: valuationData?.LimitedPropertyValue || 0,
        landValue: valuationData?.LandValue || 0,
        improvementValue: valuationData?.ImprovementValue || 0,
        taxYear: valuationData?.TaxYear || new Date().getFullYear(),
        assessedValue: valuationData?.AssessedLimitedValue || 0,
        legalDescription: propertyInfo?.PropertyDescription || '',
        lotSize: parseInt(propertyInfo?.LotSize) || 0,
        lotSizeAcres: propertyInfo?.LotSize ? (parseInt(propertyInfo.LotSize) / 43560).toFixed(3) : 0,
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
      valuation: valuationData?.ValuationHistory || [],
      assessorUrl: `https://mcassessor.maricopa.gov/mcs/?q=${cleanApn}&mod=pd`,
      _raw: { propertyInfo, residentialData, valuationData },
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