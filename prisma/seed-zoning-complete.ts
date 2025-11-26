import { PrismaClient, RuleCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding comprehensive Phoenix zoning data...')

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

  // SUBURBAN/RANCH ZONES

  // S-1 Suburban District
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'S-1',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'S-1',
      name: 'Suburban Ranch/Farm Residence',
      description: 'Suburban district with minimum lot size of 1 acre',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 40,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
            description: 'Minimum 40-foot setback from front property line',
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
            description: 'Minimum 30-foot setback from rear property line',
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
            description: 'Minimum 30-foot setback from side property lines',
          },
          {
            category: RuleCategory.LOT_SIZE,
            name: 'Minimum Lot Size',
            valueNumber: 43560,
            unit: 'square feet',
            projectTypes: ['NEW_CONSTRUCTION'],
            description: 'Minimum lot size of 1 acre (43,560 square feet)',
          },
          {
            category: RuleCategory.LOT_COVERAGE,
            name: 'Maximum Lot Coverage',
            valueNumber: 20,
            unit: 'percent',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
            description: 'Maximum 20% lot coverage (plus 5% for ADU/shade)',
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
            description: 'Maximum 2 stories, not exceeding 30 feet',
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district: S-1')

  // S-2 Suburban District
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'S-2',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'S-2',
      name: 'Suburban Residence',
      description: 'Suburban district with minimum lot size of 1/2 acre',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 40,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 25,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 20,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_SIZE,
            name: 'Minimum Lot Size',
            valueNumber: 21780,
            unit: 'square feet',
            projectTypes: ['NEW_CONSTRUCTION'],
            description: 'Minimum lot size of 1/2 acre (21,780 square feet)',
          },
          {
            category: RuleCategory.LOT_COVERAGE,
            name: 'Maximum Lot Coverage',
            valueNumber: 25,
            unit: 'percent',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district: S-2')

  // RESIDENTIAL ESTATE ZONES

  // RE-43 Residential Estate
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'RE-43',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'RE-43',
      name: 'Residential Estate',
      description: 'Estate residential district with 1-acre minimum lot size',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 35,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 25,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 20,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_SIZE,
            name: 'Minimum Lot Size',
            valueNumber: 43560,
            unit: 'square feet',
            projectTypes: ['NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district: RE-43')

  // RE-35 Residential Estate
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'RE-35',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'RE-35',
      name: 'Residential Estate',
      description: 'Estate residential district with 35,000 sq ft minimum',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 25,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 15,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_SIZE,
            name: 'Minimum Lot Size',
            valueNumber: 35000,
            unit: 'square feet',
            projectTypes: ['NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district: RE-35')

  // RE-24 Residential Estate
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'RE-24',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'RE-24',
      name: 'Residential Estate',
      description: 'Estate residential district with 24,000 sq ft minimum',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 25,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 20,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 12,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_SIZE,
            name: 'Minimum Lot Size',
            valueNumber: 24000,
            unit: 'square feet',
            projectTypes: ['NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district: RE-24')

  // SINGLE-FAMILY ZONES

  // R-1-18
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'R-1-18',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'R-1-18',
      name: 'Single-Family Residential',
      description: 'Single-family district with 18,000 sq ft minimum lot',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 25,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 20,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 10,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_SIZE,
            name: 'Minimum Lot Size',
            valueNumber: 18000,
            unit: 'square feet',
            projectTypes: ['NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_COVERAGE,
            name: 'Maximum Lot Coverage',
            valueNumber: 40,
            unit: 'percent',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.PARKING,
            name: 'Parking Requirement',
            valueText: '2 spaces per dwelling unit',
            projectTypes: ['ADU', 'NEW_CONSTRUCTION'],
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district: R-1-18')

  // R-1-14
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'R-1-14',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'R-1-14',
      name: 'Single-Family Residential',
      description: 'Single-family district with 14,000 sq ft minimum lot',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 20,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 20,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 8,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_SIZE,
            name: 'Minimum Lot Size',
            valueNumber: 14000,
            unit: 'square feet',
            projectTypes: ['NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_COVERAGE,
            name: 'Maximum Lot Coverage',
            valueNumber: 45,
            unit: 'percent',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.PARKING,
            name: 'Parking Requirement',
            valueText: '2 spaces per dwelling unit',
            projectTypes: ['ADU', 'NEW_CONSTRUCTION'],
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district: R-1-14')

  // R-1-10 (using verified data from Phoenix ordinance)
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'R-1-10',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'R-1-10',
      name: 'Single-Family Residential',
      description: 'Single-family district with 10,000 sq ft minimum lot',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 15,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 15,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 10,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_SIZE,
            name: 'Minimum Lot Size',
            valueNumber: 10000,
            unit: 'square feet',
            projectTypes: ['NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_COVERAGE,
            name: 'Maximum Lot Coverage',
            valueNumber: 60,
            unit: 'percent',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
            description: '50% plus 10% for ADU/shade structures',
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.PARKING,
            name: 'Parking Requirement',
            valueText: '2 spaces per dwelling unit',
            projectTypes: ['ADU', 'NEW_CONSTRUCTION'],
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district: R-1-10')

  // R-1-8
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'R-1-8',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'R-1-8',
      name: 'Single-Family Residential',
      description: 'Single-family district with 8,000 sq ft minimum lot',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 20,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 15,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 5,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_SIZE,
            name: 'Minimum Lot Size',
            valueNumber: 8000,
            unit: 'square feet',
            projectTypes: ['NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_COVERAGE,
            name: 'Maximum Lot Coverage',
            valueNumber: 65,
            unit: 'percent',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.PARKING,
            name: 'Parking Requirement',
            valueText: '2 spaces per dwelling unit',
            projectTypes: ['ADU', 'NEW_CONSTRUCTION'],
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district: R-1-8')

  // R-1-6 (already exists, kept for completeness)
  await prisma.zoningDistrict.upsert({
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
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 15,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 5,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_SIZE,
            name: 'Minimum Lot Size',
            valueNumber: 6000,
            unit: 'square feet',
            projectTypes: ['NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.LOT_COVERAGE,
            name: 'Maximum Lot Coverage',
            valueNumber: 65,
            unit: 'percent',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
          },
          {
            category: RuleCategory.PARKING,
            name: 'Parking Requirement',
            valueText: '2 spaces per dwelling unit',
            projectTypes: ['ADU', 'NEW_CONSTRUCTION'],
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district: R-1-6')

  // TWO-FAMILY AND MULTI-FAMILY ZONES

  // R-2 (already exists)
  await prisma.zoningDistrict.upsert({
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
  console.log('✅ Created zoning district: R-2')

  // R-3 (already exists)
  await prisma.zoningDistrict.upsert({
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
  console.log('✅ Created zoning district: R-3')

  // R-3A Multi-Family
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'R-3A',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'R-3A',
      name: 'Multi-Family Residential',
      description: 'Multi-family district with higher density than R-3',
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
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 10,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 56,
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
  console.log('✅ Created zoning district: R-3A')

  // R-4 Multi-Family
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'R-4',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'R-4',
      name: 'Multi-Family Residential',
      description: 'Multi-family district for medium-density development',
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
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 10,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 56,
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
  console.log('✅ Created zoning district: R-4')

  // R-4A Multi-Family
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'R-4A',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'R-4A',
      name: 'Multi-Family Residential',
      description: 'Multi-family district with higher density allowance',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 10,
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
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 10,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 56,
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
  console.log('✅ Created zoning district: R-4A')

  // R-5 Multi-Family
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'R-5',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'R-5',
      name: 'Multi-Family Residential',
      description: 'High-density multi-family district',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 10,
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
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 10,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 56,
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
  console.log('✅ Created zoning district: R-5')

  // SPECIAL/MIXED ZONES

  // R-O Residential Office
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'R-O',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'R-O',
      name: 'Residential Office',
      description: 'Mixed residential and office use district',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 20,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 15,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 10,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.PARKING,
            name: 'Parking Requirement',
            valueText: '3 spaces per 1,000 sq ft',
            projectTypes: ['NEW_CONSTRUCTION'],
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district: R-O')

  // R-I Residential Infill
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'R-I',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'R-I',
      name: 'Residential Infill',
      description: 'Infill residential development district',
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
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 5,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 30,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.PARKING,
            name: 'Parking Requirement',
            valueText: '1 space per unit',
            projectTypes: ['NEW_CONSTRUCTION'],
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district: R-I')

  // UR Urban Residential
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'UR',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'UR',
      name: 'Urban Residential',
      description: 'Urban mixed-use residential district',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 10,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 5,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 0,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
            description: 'Zero setback allowed for urban infill',
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 56,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.PARKING,
            name: 'Parking Requirement',
            valueText: '1 space per unit',
            projectTypes: ['NEW_CONSTRUCTION'],
          },
        ],
      },
    },
  })
  console.log('✅ Created zoning district: UR')

  // H-R High-Rise Residential
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'H-R',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'H-R',
      name: 'High-Rise Residential',
      description: 'High-rise residential development district',
      zoningRules: {
        create: [
          {
            category: RuleCategory.SETBACK,
            name: 'Front Setback',
            valueNumber: 20,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Rear Setback',
            valueNumber: 15,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 15,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 350,
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
  console.log('✅ Created zoning district: H-R')

  // H-R-1 High-Rise Residential Alternative
  await prisma.zoningDistrict.upsert({
    where: {
      municipalityId_code: {
        municipalityId: phoenix.id,
        code: 'H-R-1',
      },
    },
    update: {},
    create: {
      municipalityId: phoenix.id,
      code: 'H-R-1',
      name: 'High-Rise Residential Alternative',
      description: 'Alternative high-rise residential district with flexible standards',
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
            category: RuleCategory.SETBACK,
            name: 'Side Setback',
            valueNumber: 10,
            unit: 'feet',
            projectTypes: ['NEW_CONSTRUCTION', 'ADDITION'],
          },
          {
            category: RuleCategory.HEIGHT,
            name: 'Maximum Height',
            valueNumber: 450,
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
  console.log('✅ Created zoning district: H-R-1')

  // Get final counts
  const districtCount = await prisma.zoningDistrict.count()
  const ruleCount = await prisma.zoningRule.count()

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ COMPREHENSIVE SEEDING COMPLETE!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   📍 Municipalities: 1`)
  console.log(`   🏘️  Zoning Districts: ${districtCount}`)
  console.log(`   📋 Zoning Rules: ${ruleCount}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
