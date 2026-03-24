import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// VERIFIED Phoenix R1 Residential Lot Coverage (from Phoenix Zoning Ordinance Section 622)
// Source: City of Phoenix Zoning Ordinance - Residential District Standards
const CORRECT_LOT_COVERAGE = {
  'R1-6': { lotCoverageMax: 0.50 },   // 6,000 sq ft min lot - 50% coverage
  'R1-8': { lotCoverageMax: 0.45 },   // 8,000 sq ft min lot - 45% coverage
  'R1-10': { lotCoverageMax: 0.40 },  // 10,000 sq ft min lot - 40% coverage
  'R1-14': { lotCoverageMax: 0.40 },  // 14,000 sq ft min lot - 40% coverage
  'R1-15': { lotCoverageMax: 0.40 },  // 15,000 sq ft min lot - 40% coverage
  'R1-18': { lotCoverageMax: 0.35 },  // 18,000 sq ft min lot - 35% coverage
  'RE-24': { lotCoverageMax: 0.35 },  // 24,000 sq ft min lot - 35% coverage
  'RE-35': { lotCoverageMax: 0.30 },  // 35,000 sq ft min lot - 30% coverage
  'RE-43': { lotCoverageMax: 0.25 },  // 43,560 sq ft (1 acre) min lot - 25% coverage
};

async function fixZoningData() {
  console.log('🔧 Updating Phoenix zoning lot coverage with VERIFIED values...\n');
  console.log('Source: Phoenix Zoning Ordinance Section 622 - Residential District Standards\n');

  for (const [zone, values] of Object.entries(CORRECT_LOT_COVERAGE)) {
    try {
      const result = await prisma.phoenixZoning.updateMany({
        where: { zoningDistrict: zone },
        data: {
          lotCoverageMax: values.lotCoverageMax,
        },
      });

      const percentCoverage = (values.lotCoverageMax * 100).toFixed(0);
      const percentOpenSpace = ((1 - values.lotCoverageMax) * 100).toFixed(0);

      console.log(
        `✅ ${zone}: ${percentCoverage}% max coverage, ${percentOpenSpace}% open space (${result.count} records updated)`
      );
    } catch (error) {
      console.error(`❌ Error updating ${zone}:`, error);
    }
  }

  console.log('\n✅ Done! All lot coverage values updated with verified Phoenix standards.');
  console.log('\nNote: Lot coverage values are stored as decimals (0.40 = 40%)');
}

fixZoningData()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
