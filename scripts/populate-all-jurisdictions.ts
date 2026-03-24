import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CHANDLER ZONING DATA
const CHANDLER_ZONING = {
  'SF-43': { districtName: 'Single Family SF-43 District', minLotSize: 43560, maxLotCoverage: 25, minOpenSpace: 75, frontSetback: 40, sideSetback: 25, rearSetback: 40, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 1000, aduMaxHeight: 25, aduMinSetback: 10, aduParkingRequired: 1 },
  'SF-35': { districtName: 'Single Family SF-35 District', minLotSize: 35000, maxLotCoverage: 30, minOpenSpace: 70, frontSetback: 35, sideSetback: 15, rearSetback: 35, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 1000, aduMaxHeight: 25, aduMinSetback: 10, aduParkingRequired: 1 },
  'SF-18': { districtName: 'Single Family SF-18 District', minLotSize: 18000, maxLotCoverage: 35, minOpenSpace: 65, frontSetback: 25, sideSetback: 10, rearSetback: 25, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 850, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'SF-10': { districtName: 'Single Family SF-10 District', minLotSize: 10000, maxLotCoverage: 40, minOpenSpace: 60, frontSetback: 20, sideSetback: 7, rearSetback: 20, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 800, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'SF-8.5': { districtName: 'Single Family SF-8.5 District', minLotSize: 8500, maxLotCoverage: 45, minOpenSpace: 55, frontSetback: 20, sideSetback: 6, rearSetback: 15, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 750, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'SF-7': { districtName: 'Single Family SF-7 District', minLotSize: 7000, maxLotCoverage: 50, minOpenSpace: 50, frontSetback: 20, sideSetback: 5, rearSetback: 15, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 700, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'SF-6': { districtName: 'Single Family SF-6 District', minLotSize: 6000, maxLotCoverage: 55, minOpenSpace: 45, frontSetback: 18, sideSetback: 5, rearSetback: 15, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 650, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
};

// SCOTTSDALE ZONING DATA
const SCOTTSDALE_ZONING = {
  'R1-190': { districtName: 'Single Family R1-190 District', minLotSize: 190000, maxLotCoverage: 15, minOpenSpace: 85, frontSetback: 60, sideSetback: 50, rearSetback: 50, maxHeight: 24, aduAllowed: true, maxADUs: 1, aduMaxSize: 1000, aduMaxHeight: 24, aduMinSetback: 50, aduParkingRequired: 1 },
  'R1-130': { districtName: 'Single Family R1-130 District', minLotSize: 130000, maxLotCoverage: 20, minOpenSpace: 80, frontSetback: 50, sideSetback: 40, rearSetback: 40, maxHeight: 24, aduAllowed: true, maxADUs: 1, aduMaxSize: 1000, aduMaxHeight: 24, aduMinSetback: 40, aduParkingRequired: 1 },
  'R1-70': { districtName: 'Single Family R1-70 District', minLotSize: 70000, maxLotCoverage: 25, minOpenSpace: 75, frontSetback: 40, sideSetback: 30, rearSetback: 30, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 1000, aduMaxHeight: 25, aduMinSetback: 30, aduParkingRequired: 1 },
  'R1-43': { districtName: 'Single Family R1-43 District', minLotSize: 43560, maxLotCoverage: 30, minOpenSpace: 70, frontSetback: 35, sideSetback: 25, rearSetback: 25, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 1000, aduMaxHeight: 25, aduMinSetback: 15, aduParkingRequired: 1 },
  'R1-35': { districtName: 'Single Family R1-35 District', minLotSize: 35000, maxLotCoverage: 35, minOpenSpace: 65, frontSetback: 30, sideSetback: 15, rearSetback: 25, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 1000, aduMaxHeight: 25, aduMinSetback: 10, aduParkingRequired: 1 },
  'R1-18': { districtName: 'Single Family R1-18 District', minLotSize: 18000, maxLotCoverage: 40, minOpenSpace: 60, frontSetback: 25, sideSetback: 10, rearSetback: 20, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 850, aduMaxHeight: 25, aduMinSetback: 10, aduParkingRequired: 1 },
  'R1-10': { districtName: 'Single Family R1-10 District', minLotSize: 10000, maxLotCoverage: 45, minOpenSpace: 55, frontSetback: 25, sideSetback: 7, rearSetback: 20, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 800, aduMaxHeight: 25, aduMinSetback: 7, aduParkingRequired: 1 },
  'R1-7': { districtName: 'Single Family R1-7 District', minLotSize: 7000, maxLotCoverage: 50, minOpenSpace: 50, frontSetback: 20, sideSetback: 5, rearSetback: 15, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 750, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'R1-5': { districtName: 'Single Family R1-5 District', minLotSize: 5000, maxLotCoverage: 55, minOpenSpace: 45, frontSetback: 20, sideSetback: 5, rearSetback: 15, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 650, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
};

// MESA ZONING DATA
const MESA_ZONING = {
  'RS-90': { districtName: 'Single Family RS-90 District', minLotSize: 90000, maxLotCoverage: 25, minOpenSpace: 75, frontSetback: 40, sideSetback: 30, rearSetback: 40, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 1000, aduMaxHeight: 25, aduMinSetback: 15, aduParkingRequired: 1 },
  'RS-43': { districtName: 'Single Family RS-43 District', minLotSize: 43560, maxLotCoverage: 30, minOpenSpace: 70, frontSetback: 35, sideSetback: 20, rearSetback: 30, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 1000, aduMaxHeight: 25, aduMinSetback: 10, aduParkingRequired: 1 },
  'RS-35': { districtName: 'Single Family RS-35 District', minLotSize: 35000, maxLotCoverage: 35, minOpenSpace: 65, frontSetback: 30, sideSetback: 15, rearSetback: 25, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 900, aduMaxHeight: 25, aduMinSetback: 10, aduParkingRequired: 1 },
  'RS-15': { districtName: 'Single Family RS-15 District', minLotSize: 15000, maxLotCoverage: 40, minOpenSpace: 60, frontSetback: 25, sideSetback: 10, rearSetback: 20, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 850, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'RS-9': { districtName: 'Single Family RS-9 District', minLotSize: 9000, maxLotCoverage: 45, minOpenSpace: 55, frontSetback: 20, sideSetback: 7, rearSetback: 20, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 800, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'RS-7': { districtName: 'Single Family RS-7 District', minLotSize: 7000, maxLotCoverage: 50, minOpenSpace: 50, frontSetback: 20, sideSetback: 5, rearSetback: 15, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 750, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'RS-6': { districtName: 'Single Family RS-6 District', minLotSize: 6000, maxLotCoverage: 55, minOpenSpace: 45, frontSetback: 20, sideSetback: 5, rearSetback: 15, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 700, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
};

// GILBERT ZONING DATA
const GILBERT_ZONING = {
  'SF-43': { districtName: 'Single Family SF-43 District', minLotSize: 43560, maxLotCoverage: 30, minOpenSpace: 70, frontSetback: 35, sideSetback: 20, rearSetback: 30, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 1000, aduMaxHeight: 25, aduMinSetback: 10, aduParkingRequired: 1 },
  'SF-35': { districtName: 'Single Family SF-35 District', minLotSize: 35000, maxLotCoverage: 35, minOpenSpace: 65, frontSetback: 30, sideSetback: 15, rearSetback: 25, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 900, aduMaxHeight: 25, aduMinSetback: 10, aduParkingRequired: 1 },
  'SF-20': { districtName: 'Single Family SF-20 District', minLotSize: 20000, maxLotCoverage: 40, minOpenSpace: 60, frontSetback: 25, sideSetback: 10, rearSetback: 20, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 850, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'SF-10': { districtName: 'Single Family SF-10 District', minLotSize: 10000, maxLotCoverage: 45, minOpenSpace: 55, frontSetback: 20, sideSetback: 7, rearSetback: 15, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 800, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'SF-7': { districtName: 'Single Family SF-7 District', minLotSize: 7000, maxLotCoverage: 50, minOpenSpace: 50, frontSetback: 20, sideSetback: 5, rearSetback: 15, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 750, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'SF-6': { districtName: 'Single Family SF-6 District', minLotSize: 6000, maxLotCoverage: 55, minOpenSpace: 45, frontSetback: 18, sideSetback: 5, rearSetback: 15, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 700, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
};

// TEMPE ZONING DATA
const TEMPE_ZONING = {
  'R1-10': { districtName: 'Single Family R1-10 District', minLotSize: 10000, maxLotCoverage: 40, minOpenSpace: 60, frontSetback: 25, sideSetback: 8, rearSetback: 25, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 800, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'R1-8': { districtName: 'Single Family R1-8 District', minLotSize: 8000, maxLotCoverage: 45, minOpenSpace: 55, frontSetback: 20, sideSetback: 6, rearSetback: 20, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 750, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'R1-6': { districtName: 'Single Family R1-6 District', minLotSize: 6000, maxLotCoverage: 50, minOpenSpace: 50, frontSetback: 20, sideSetback: 5, rearSetback: 15, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 700, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'R1-5': { districtName: 'Single Family R1-5 District', minLotSize: 5000, maxLotCoverage: 55, minOpenSpace: 45, frontSetback: 20, sideSetback: 5, rearSetback: 15, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 650, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
  'R1-4': { districtName: 'Single Family R1-4 District', minLotSize: 4000, maxLotCoverage: 60, minOpenSpace: 40, frontSetback: 15, sideSetback: 5, rearSetback: 15, maxHeight: 30, aduAllowed: true, maxADUs: 1, aduMaxSize: 600, aduMaxHeight: 25, aduMinSetback: 5, aduParkingRequired: 1 },
};

async function populateJurisdiction(jurisdiction: string, zoningData: Record<string, any>) {
  console.log(`\n📍 ${jurisdiction.toUpperCase()}`);
  let created = 0, updated = 0;

  for (const [district, data] of Object.entries(zoningData)) {
    try {
      const existing = await prisma.phoenixZoning.findFirst({
        where: { jurisdiction, zoningDistrict: district }
      });

      // Convert percentage to decimal and remove unsupported fields
      const { maxLotCoverage, minOpenSpace, aduParkingRequired, ...rest } = data;
      const fullData = {
        jurisdiction,
        zoningDistrict: district,
        ...rest,
        lotCoverageMax: maxLotCoverage / 100 // Convert 25 to 0.25
      };

      if (existing) {
        await prisma.phoenixZoning.update({ where: { id: existing.id }, data: fullData });
        updated++;
      } else {
        await prisma.phoenixZoning.create({ data: fullData });
        created++;
      }
      console.log(`  ✅ ${district}: Coverage ${maxLotCoverage}%, Height ${data.maxHeight}ft`);
    } catch (error) {
      console.error(`  ❌ ${district}:`, error);
    }
  }
  return { created, updated };
}

async function main() {
  console.log('🏛️ POPULATING ALL JURISDICTION ZONING DATA\n');

  const jurisdictions = [
    { name: 'chandler', data: CHANDLER_ZONING },
    { name: 'scottsdale', data: SCOTTSDALE_ZONING },
    { name: 'mesa', data: MESA_ZONING },
    { name: 'gilbert', data: GILBERT_ZONING },
    { name: 'tempe', data: TEMPE_ZONING },
  ];

  let totalCreated = 0, totalUpdated = 0;

  for (const { name, data } of jurisdictions) {
    const result = await populateJurisdiction(name, data);
    totalCreated += result.created;
    totalUpdated += result.updated;
  }

  console.log('\n📊 SUMMARY');
  console.log(`   Created: ${totalCreated} | Updated: ${totalUpdated}`);

  // Show counts per jurisdiction
  console.log('\n📋 ZONES BY JURISDICTION:');
  for (const j of ['phoenix', 'chandler', 'scottsdale', 'mesa', 'gilbert', 'tempe']) {
    const count = await prisma.phoenixZoning.count({ where: { jurisdiction: j } });
    console.log(`   ${j}: ${count} zones`);
  }
}

main()
  .then(() => console.log('\n🎉 Done!'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
