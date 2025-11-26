import { PrismaClient, RuleCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding zoning data...')

  // Create Phoenix Municipality
  const phoenix = await prisma.municipality.upsert({
    where: {
      id: 'phoenix-az'
    },
    update: {},
    create: {
      id: 'phoenix-az',
      name: 'Phoenix',
      state: 'Arizona',
    },
  })
  console.log('✅ Created municipality:', phoenix.name)

  // Create R-1-6 Zoning District (Single-Family Residential)
  const r16 = await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'R-1-6',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'R-1-6',
      name: 'Single-Family Residential',
      description: 'Single-family residential district with minimum lot size of 6,000 square feet',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 20,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
            description: 'Minimum 20-foot setback from front property line',
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 15,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
            description: 'Minimum 15-foot setback from rear property line',
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 5,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
            description: 'Minimum 5-foot setback from side property lines',
          },
          {
            category: RuleCategory.LOT_SIZE,
            name: 'Minimum Lot Size',
            valueNumber: 6000,
            unit: 'square feet',
            projectTypes: ['NEW_CONSTRUCTION'],
            description: 'Minimum lot size of 6,000 square feet for new construction',
          },
          {
            category: RuleCategory.LOT_COVERAGE,
            name: 'Maximum Lot Coverage',
            valueNumber: 65,
            unit: 'percent',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
            description: 'Maximum 65% of lot can be covered by structures',
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
            description: 'Maximum structure height of 30 feet',
          },
          {
            category: RuleCategory.PARKING,
            name: 'Parking Requirement',
            valueText: '2 spaces per dwelling unit',
            projectTypes: ['ADU', 'NEW_CONSTRUCTION'],
            description: 'Two off-street parking spaces required per dwelling unit',
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district:', r16.code, r16.name)

  // Create R-2 Zoning District (Two-Family Residential)
  const r2 = await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'R-2',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'R-2',
      name: 'Two-Family Residential',
      description: 'Two-family residential district allowing duplexes',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 20,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 15,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 5,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_SIZE,
            name: 'Minimum Lot Size',
            valueNumber: 5000,
            unit: 'square feet',
            projectTypes: ['NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.PARKING,
            name: 'Parking Requirement',
            valueText: '2 spaces per dwelling unit',
            projectTypes: ['NEW_CONSTRUCTION'],
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district:', r2.code, r2.name)

  // Create R-3 Zoning District (Multi-Family Residential)
  const r3 = await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'R-3',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'R-3',
      name: 'Multi-Family Residential',
      description: 'Multi-family residential district allowing apartments and townhomes',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 15,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 10,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 45,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.PARKING,
            name: 'Parking Requirement',
            valueText: '1.5 spaces per unit',
            projectTypes: ['NEW_CONSTRUCTION'],
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district:', r3.code, r3.name)

  // Get counts
  const districtCount = await prisma.zoningDistrict.count()
  const ruleCount = await prisma.zoningRule.count()

  console.log('✅ Seeding complete!')
  console.log(`   📍 Municipalities: 1`)
  console.log(`   🏘️  Zoning Districts: ${districtCount}`)
  console.log(`   📋 Zoning Rules: ${ruleCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
