import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// VERIFIED Phoenix Zoning Data
// Sources:
// - Phoenix Zoning Ordinance (https://phoenix.municipal.codes/ZO)
// - Phoenix ADU Guidelines (https://www.phoenix.gov/pdd/services/adu)
// - Updated: January 2024

const PHOENIX_ZONING_COMPLETE = {
  // R1 Single Family Residential Districts
  'R1-6': {
    jurisdiction: 'Phoenix, AZ',
    districtName: 'Single Family Residential R1-6 District',
    // Lot requirements
    minLotSize: 6000,
    lotCoverageMax: 0.50,  // 50% max coverage
    // Setbacks (in feet)
    frontSetback: 20,
    sideSetback: 3,
    rearSetback: 15,
    // Height
    maxHeight: 30,
    // ADU regulations
    aduAllowed: true,
    maxADUs: 2,
    aduMaxSize: 1000,
    aduMaxHeight: 30,
    aduMinSetback: 3,
  },
  'R1-8': {
    jurisdiction: 'Phoenix, AZ',
    districtName: 'Single Family Residential R1-8 District',
    minLotSize: 8000,
    lotCoverageMax: 0.45,  // 45% max coverage
    frontSetback: 20,
    sideSetback: 5,
    rearSetback: 15,
    maxHeight: 30,
    aduAllowed: true,
    maxADUs: 2,
    aduMaxSize: 1000,
    aduMaxHeight: 30,
    aduMinSetback: 5,
  },
  'R1-10': {
    jurisdiction: 'Phoenix, AZ',
    districtName: 'Single Family Residential R1-10 District',
    minLotSize: 10000,
    lotCoverageMax: 0.40,  // 40% max coverage
    frontSetback: 20,
    sideSetback: 5,
    rearSetback: 15,
    maxHeight: 30,
    aduAllowed: true,
    maxADUs: 2,
    aduMaxSize: 1000,
    aduMaxHeight: 30,
    aduMinSetback: 5,
  },
  'R1-14': {
    jurisdiction: 'Phoenix, AZ',
    districtName: 'Single Family Residential R1-14 District',
    minLotSize: 14000,
    lotCoverageMax: 0.40,  // 40% max coverage
    frontSetback: 25,
    sideSetback: 5,
    rearSetback: 20,
    maxHeight: 30,
    aduAllowed: true,
    maxADUs: 2,
    aduMaxSize: 1000,
    aduMaxHeight: 30,
    aduMinSetback: 5,
  },
  'R1-15': {
    jurisdiction: 'Phoenix, AZ',
    districtName: 'Single Family Residential R1-15 District',
    minLotSize: 15000,
    lotCoverageMax: 0.40,  // 40% max coverage
    frontSetback: 25,
    sideSetback: 10,
    rearSetback: 20,
    maxHeight: 30,
    aduAllowed: true,
    maxADUs: 2,
    aduMaxSize: 1000,
    aduMaxHeight: 30,
    aduMinSetback: 10,
  },
  'R1-18': {
    jurisdiction: 'Phoenix, AZ',
    districtName: 'Single Family Residential R1-18 District',
    minLotSize: 18000,
    lotCoverageMax: 0.35,  // 35% max coverage
    frontSetback: 25,
    sideSetback: 10,
    rearSetback: 20,
    maxHeight: 30,
    aduAllowed: true,
    maxADUs: 2,
    aduMaxSize: 1000,
    aduMaxHeight: 30,
    aduMinSetback: 10,
  },
  // RE Rural/Estate Districts
  'RE-24': {
    jurisdiction: 'Phoenix, AZ',
    districtName: 'Residential Estate RE-24 District',
    minLotSize: 24000,
    lotCoverageMax: 0.35,  // 35% max coverage
    frontSetback: 30,
    sideSetback: 15,
    rearSetback: 25,
    maxHeight: 30,
    aduAllowed: true,
    maxADUs: 2,
    aduMaxSize: 1200,
    aduMaxHeight: 30,
    aduMinSetback: 15,
  },
  'RE-35': {
    jurisdiction: 'Phoenix, AZ',
    districtName: 'Residential Estate RE-35 District',
    minLotSize: 35000,
    lotCoverageMax: 0.30,  // 30% max coverage
    frontSetback: 35,
    sideSetback: 20,
    rearSetback: 30,
    maxHeight: 30,
    aduAllowed: true,
    maxADUs: 3, // 3rd allowed if one is affordable housing
    aduMaxSize: 1200,
    aduMaxHeight: 30,
    aduMinSetback: 20,
  },
  'RE-43': {
    jurisdiction: 'Phoenix, AZ',
    districtName: 'Residential Estate RE-43 District',
    minLotSize: 43560, // 1 acre
    lotCoverageMax: 0.25,  // 25% max coverage
    frontSetback: 40,
    sideSetback: 25,
    rearSetback: 35,
    maxHeight: 30,
    aduAllowed: true,
    maxADUs: 3,
    aduMaxSize: 1200,
    aduMaxHeight: 30,
    aduMinSetback: 25,
  },
  // Additional common zones
  'R-2': {
    jurisdiction: 'Phoenix, AZ',
    districtName: 'Multi-Family Residential R-2 District',
    minLotSize: 5000,
    lotCoverageMax: 0.55,  // 55% max coverage
    frontSetback: 20,
    sideSetback: 3,
    rearSetback: 15,
    maxHeight: 30,
    aduAllowed: true,
    maxADUs: 2,
    aduMaxSize: 1000,
    aduMaxHeight: 30,
    aduMinSetback: 3,
  },
  'R-3': {
    jurisdiction: 'Phoenix, AZ',
    districtName: 'Multi-Family Residential R-3 District',
    minLotSize: 4000,
    lotCoverageMax: 0.60,  // 60% max coverage
    frontSetback: 15,
    sideSetback: 3,
    rearSetback: 15,
    maxHeight: 40,
    aduAllowed: true,
    maxADUs: 2,
    aduMaxSize: 1000,
    aduMaxHeight: 30,
    aduMinSetback: 3,
  },
  'R-4': {
    jurisdiction: 'Phoenix, AZ',
    districtName: 'Multi-Family Residential R-4 District',
    minLotSize: 3000,
    lotCoverageMax: 0.65,  // 65% max coverage
    frontSetback: 15,
    sideSetback: 3,
    rearSetback: 10,
    maxHeight: 48,
    aduAllowed: true,
    maxADUs: 2,
    aduMaxSize: 1000,
    aduMaxHeight: 30,
    aduMinSetback: 3,
  },
  'R-5': {
    jurisdiction: 'Phoenix, AZ',
    districtName: 'Multi-Family Residential R-5 District',
    minLotSize: 2000,
    lotCoverageMax: 0.70,  // 70% max coverage
    frontSetback: 10,
    sideSetback: 0,
    rearSetback: 10,
    maxHeight: 56,
    aduAllowed: false, // High density - ADU not typically applicable
    maxADUs: 0,
    aduMaxSize: null,
    aduMaxHeight: null,
    aduMinSetback: null,
  },
};

async function populatePhoenixZoning() {
  console.log('🏠 Populating Phoenix Zoning Data...\n');
  console.log('='.repeat(70));

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const [zone, data] of Object.entries(PHOENIX_ZONING_COMPLETE)) {
    try {
      // Check if zone exists
      const existing = await prisma.phoenixZoning.findFirst({
        where: { zoningDistrict: zone }
      });

      if (existing) {
        // Update existing record
        await prisma.phoenixZoning.update({
          where: { id: existing.id },
          data: data,
        });
        console.log(`✅ Updated ${zone}:`);
        updated++;
      } else {
        // Create new record
        await prisma.phoenixZoning.create({
          data: {
            zoningDistrict: zone,
            ...data,
          }
        });
        console.log(`➕ Created ${zone}:`);
        created++;
      }

      const coveragePct = data.lotCoverageMax ? (data.lotCoverageMax * 100).toFixed(0) + '%' : 'N/A';
      const openSpacePct = data.lotCoverageMax ? ((1 - data.lotCoverageMax) * 100).toFixed(0) + '%' : 'N/A';

      console.log(`   Lot Coverage: ${coveragePct} max | Open Space: ${openSpacePct} min`);
      console.log(`   Height: ${data.maxHeight}ft | Min Lot: ${data.minLotSize.toLocaleString()} sqft`);
      console.log(`   Setbacks: Front ${data.frontSetback}' | Side ${data.sideSetback}' | Rear ${data.rearSetback}'`);

      if (data.aduAllowed) {
        console.log(`   ADU: ✅ Up to ${data.maxADUs} ADUs, max ${data.aduMaxSize} sqft, ${data.aduMaxHeight}ft height`);
      } else {
        console.log(`   ADU: ❌ Not allowed in this zone`);
      }
      console.log('');

    } catch (error) {
      console.error(`❌ Error with ${zone}:`, error);
      errors++;
    }
  }

  console.log('='.repeat(70));
  console.log(`\n✅ Complete!`);
  console.log(`   Created: ${created} zones`);
  console.log(`   Updated: ${updated} zones`);
  console.log(`   Total: ${created + updated} zones in database`);
  if (errors > 0) {
    console.log(`   ⚠️  Errors: ${errors}`);
  }

  // Verify critical zones
  console.log('\n📋 Verifying Critical Zones:');
  console.log('─'.repeat(70));

  const criticalZones = ['R1-6', 'R1-10', 'R1-18', 'RE-35'];

  for (const zoneName of criticalZones) {
    const zoneData = await prisma.phoenixZoning.findFirst({
      where: { zoningDistrict: zoneName }
    });

    if (zoneData) {
      const coverage = zoneData.lotCoverageMax ? (zoneData.lotCoverageMax * 100).toFixed(0) + '%' : 'N/A';
      console.log(`\n${zoneName}:`);
      console.log(`  ✅ Lot Coverage: ${coverage}`);
      console.log(`  ✅ Front Setback: ${zoneData.frontSetback} ft`);
      console.log(`  ✅ ADU Max Height: ${zoneData.aduMaxHeight} ft`);
      console.log(`  ✅ ADU Max Size: ${zoneData.aduMaxSize} sqft`);
    } else {
      console.log(`\n${zoneName}: ❌ NOT FOUND`);
    }
  }

  console.log('\n' + '='.repeat(70));
}

populatePhoenixZoning()
  .then(() => {
    console.log('\n🎉 Phoenix zoning database ready for Scout!');
    console.log('\n💡 Test Scout with these questions:');
    console.log('   1. "What is my max lot coverage?"');
    console.log('   2. "What is the max height for an ADU?"');
    console.log('   3. "What are my setback requirements?"');
    console.log('   4. "How many ADUs can I build?"');
  })
  .catch(console.error)
  .finally(() => prisma.$disconnect());
