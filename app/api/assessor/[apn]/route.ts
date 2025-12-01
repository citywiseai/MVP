import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MARICOPA_PROXY = 'https://maricopa-proxy.reziopro.workers.dev';

// Helper to safely fetch from proxy
async function fetchFromProxy(url: string) {
  try {
    const proxyUrl = `${MARICOPA_PROXY}?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    const text = await res.text();
    if (text.trim().startsWith('<')) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

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
    // Fetch from Maricopa Assessor (via proxy)
    const [propertyData, residentialData] = await Promise.all([
      fetchFromProxy(`https://mcassessor.maricopa.gov/parcel/${cleanApn}/propertyinfo`),
      fetchFromProxy(`https://mcassessor.maricopa.gov/parcel/${cleanApn}/residential-details`),
    ]);

    // Fetch from Regrid (database)
    const parcel = await prisma.parcel.findFirst({
      where: { apn: cleanApn },
    });

    const regridMetadata = (parcel?.propertyMetadata as any) || {};
    const regridFields = regridMetadata.fields || {};

    // Parse assessor address
    const fullAddress = propertyData?.PropertyAddress || '';
    const addressMatch = fullAddress.match(/^(.+?)\s+(PHOENIX|SCOTTSDALE|TEMPE|MESA|CHANDLER|GLENDALE|GILBERT|PEORIA|SURPRISE|AVONDALE|GOODYEAR|BUCKEYE|CAVE CREEK|CAREFREE|FOUNTAIN HILLS|PARADISE VALLEY),?\s*AZ\s*(\d{5})?/i);
    const assessorStreet = addressMatch ? addressMatch[1].trim() : fullAddress;
    const assessorCity = addressMatch ? addressMatch[2] : '';
    const assessorZip = addressMatch ? addressMatch[3] || '' : '';

    // Build combined data with source tracking
    // Priority: Assessor > Regrid (except where Assessor is missing)
    
    const result = {
      success: true,
      parcel: {
        parcelNumber: cleanApn,
        // Address - prefer Assessor
        situsStreet1: {
          value: assessorStreet || parcel?.address || '',
          source: assessorStreet ? 'assessor' : 'regrid',
        },
        situsCity: {
          value: assessorCity || propertyData?.LocalJusidiction || parcel?.city || 'Phoenix',
          assessorValue: assessorCity || propertyData?.LocalJusidiction || null,
          regridValue: parcel?.city || regridFields.scity || null,
          source: (assessorCity || propertyData?.LocalJusidiction) ? 'assessor' : 'regrid',
          hasConflict: !!(assessorCity || propertyData?.LocalJusidiction) && 
                       !!(parcel?.city) && 
                       (assessorCity || propertyData?.LocalJusidiction)?.toLowerCase() !== parcel?.city?.toLowerCase(),
        },
        situsState: 'AZ',
        situsZip: {
          value: assessorZip || parcel?.zip || '',
          source: assessorZip ? 'assessor' : 'regrid',
        },
        propertyClass: {
          value: propertyData?.PropertyType || regridFields.usecode || 'Residential',
          source: propertyData?.PropertyType ? 'assessor' : 'regrid',
        },
        propertyType: {
          value: propertyData?.PropertyType || regridFields.usedesc || 'Single Family',
          source: propertyData?.PropertyType ? 'assessor' : 'regrid',
        },
        subdivision: {
          value: propertyData?.SubdivisionName || regridFields.subdivision || '',
          source: propertyData?.SubdivisionName ? 'assessor' : 'regrid',
        },
        schoolDistrict: {
          value: propertyData?.HighSchoolDistrict || regridFields.school_district || '',
          source: propertyData?.HighSchoolDistrict ? 'assessor' : 'regrid',
        },
        taxArea: {
          value: residentialData?.AssessorMarket || regridFields.taession || '',
          source: residentialData?.AssessorMarket ? 'assessor' : 'regrid',
        },
        legalDescription: {
          value: propertyData?.PropertyDescription || regridFields.legaldesc || '',
          source: propertyData?.PropertyDescription ? 'assessor' : 'regrid',
        },
        lotSize: {
          value: parseInt(residentialData?.LotSize) || parcel?.lotSizeSqFt || 0,
          assessorValue: parseInt(residentialData?.LotSize) || null,
          regridValue: parcel?.lotSizeSqFt || null,
          source: residentialData?.LotSize ? 'assessor' : 'regrid',
          hasConflict: !!(parseInt(residentialData?.LotSize)) && 
                       !!(parcel?.lotSizeSqFt) && 
                       Math.abs(parseInt(residentialData?.LotSize) - (parcel?.lotSizeSqFt || 0)) > 100,
        },
        lotSizeAcres: {
          value: residentialData?.LotSize 
            ? (parseInt(residentialData.LotSize) / 43560).toFixed(3) 
            : (regridFields.ll_gisacre ? parseFloat(regridFields.ll_gisacre).toFixed(3) : '0'),
          source: residentialData?.LotSize ? 'assessor' : 'regrid',
        },
        zoning: {
          value: parcel?.zoning || regridFields.zoning || '',
          source: 'regrid', // Assessor doesn't provide zoning
        },
        ownership: {
          value: regridFields.owner || '',
          source: 'regrid',
        },
      },
      residential: {
        livingArea: {
          value: parseInt(residentialData?.LivableSpace) || parcel?.totalBuildingSF || 0,
          assessorValue: parseInt(residentialData?.LivableSpace) || null,
          regridValue: parcel?.totalBuildingSF || (regridFields.sqft ? parseInt(regridFields.sqft) : null),
          source: residentialData?.LivableSpace ? 'assessor' : 'regrid',
          hasConflict: !!(parseInt(residentialData?.LivableSpace)) && 
                       !!(parcel?.totalBuildingSF || regridFields.sqft) && 
                       Math.abs(parseInt(residentialData?.LivableSpace) - (parcel?.totalBuildingSF || parseInt(regridFields.sqft) || 0)) > 100,
        },
        yearBuilt: {
          value: parseInt(residentialData?.ConstructionYear) || (regridFields.yearbuilt ? parseInt(regridFields.yearbuilt) : 0),
          assessorValue: parseInt(residentialData?.ConstructionYear) || null,
          regridValue: regridFields.yearbuilt ? parseInt(regridFields.yearbuilt) : null,
          source: residentialData?.ConstructionYear ? 'assessor' : 'regrid',
          hasConflict: !!(parseInt(residentialData?.ConstructionYear)) && 
                       !!(regridFields.yearbuilt) && 
                       parseInt(residentialData?.ConstructionYear) !== parseInt(regridFields.yearbuilt),
        },
        bedrooms: {
          value: regridFields.bedrooms ? parseInt(regridFields.bedrooms) : 0,
          source: 'regrid', // Assessor doesn't provide bedrooms
        },
        bathrooms: {
          value: residentialData?.BathFixtures 
            ? Math.floor(parseInt(residentialData.BathFixtures) / 3)
            : (regridFields.bathrooms ? parseFloat(regridFields.bathrooms) : 0),
          assessorValue: residentialData?.BathFixtures ? Math.floor(parseInt(residentialData.BathFixtures) / 3) : null,
          regridValue: regridFields.bathrooms ? parseFloat(regridFields.bathrooms) : null,
          source: residentialData?.BathFixtures ? 'assessor' : 'regrid',
        },
        stories: {
          value: regridFields.stories ? parseInt(regridFields.stories) : 1,
          source: 'regrid', // Assessor doesn't provide stories
        },
        garageSpaces: {
          value: parseInt(residentialData?.NumberOfGarages) || (regridFields.garage ? parseInt(regridFields.garage) : 0),
          source: residentialData?.NumberOfGarages ? 'assessor' : 'regrid',
        },
        pool: {
          value: residentialData?.Pool || regridFields.pool === 'Y' || regridFields.pool === true,
          source: residentialData?.Pool !== undefined ? 'assessor' : 'regrid',
        },
        roofType: {
          value: residentialData?.RoofType || '',
          source: 'assessor',
        },
        exteriorWalls: {
          value: residentialData?.ExteriorWalls || '',
          source: 'assessor',
        },
        cooling: {
          value: residentialData?.Cooling || '',
          source: 'assessor',
        },
        heating: {
          value: residentialData?.Heating || '',
          source: 'assessor',
        },
        qualityGrade: {
          value: residentialData?.ImprovementQualityGrade || '',
          source: 'assessor',
        },
      },
      valuation: {
        fullCashValue: {
          value: regridFields.assdtotal ? parseInt(regridFields.assdtotal) : 0,
          source: 'regrid',
        },
        landValue: {
          value: regridFields.assdland ? parseInt(regridFields.assdland) : 0,
          source: 'regrid',
        },
        improvementValue: {
          value: regridFields.assdimpr ? parseInt(regridFields.assdimpr) : 0,
          source: 'regrid',
        },
        marketValue: {
          value: regridFields.mktval ? parseInt(regridFields.mktval) : 0,
          source: 'regrid',
        },
        taxYear: {
          value: regridFields.tax_year || new Date().getFullYear(),
          source: 'regrid',
        },
      },
      assessorUrl: `https://mcassessor.maricopa.gov/mcs/?q=${cleanApn}&mod=pd`,
      _sources: {
        assessor: !!(propertyData || residentialData),
        regrid: !!parcel,
      },
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Combined report API error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      assessorUrl: `https://mcassessor.maricopa.gov/mcs/?q=${cleanApn}&mod=pd`,
    }, { status: 500 });
  }
}
