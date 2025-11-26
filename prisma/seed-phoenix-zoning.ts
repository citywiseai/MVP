import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const phoenixZoning = [
  // Estate Residential Zones
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "RE-43",
    districtName: "Residential Estate RE-43 District—One-Family Residence",
    frontSetback: 30,
    sideSetback: 30,
    rearSetback: 30,
    lotCoverageMax: 0.20,
    maxHeight: 30,
    maxStories: 2,
    minLotSize: 43560,
    minLotWidth: 165,
    minLotDepth: 175,
    aduAllowed: true,
    maxADUs: 3,
    aduMinSetback: 5,
    aduMaxSize: 1200,
    aduMaxHeight: 20,
    parkingPerUnit: 2.0,
    coveredParking: true,
    fenceMaxHeight: 6,
    landscapeReq: "Minimum landscaping required per Section 703",
    permittedUses: JSON.stringify([
      "Single-family dwelling",
      "Accessory dwelling units (up to 3)",
      "Home occupations",
      "Household pets",
      "Private swimming pools"
    ]),
    specialRules: "Third ADU permitted only when at least one ADU qualifies as affordable housing. Main building and all accessory buildings shall not occupy more than 20% of net lot area, except if all structures are less than 20 feet and one story then 40% lot coverage allowed.",
    description: "Estate residential with 1-acre minimum lots. Up to 3 ADUs allowed if one qualifies as affordable housing.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/605"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "RE-24",
    districtName: "Residential Estate RE-24 District—One-Family Residence",
    frontSetback: 30,
    sideSetback: 30,
    rearSetback: 30,
    lotCoverageMax: 0.20,
    maxHeight: 30,
    maxStories: 2,
    minLotSize: 24000,
    minLotWidth: 120,
    minLotDepth: 150,
    aduAllowed: true,
    maxADUs: 2,
    description: "Estate residential with 24,000 sq ft minimum lots.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/606"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "RE-35",
    districtName: "RE-35 Single-Family Residence District",
    frontSetback: 40,
    sideSetback: 30,
    rearSetback: 30,
    lotCoverageMax: 0.20,
    maxHeight: 30,
    maxStories: 2,
    minLotSize: 35000,
    minLotWidth: 150,
    minLotDepth: 175,
    aduAllowed: true,
    maxADUs: 2,
    description: "Single-family estate residential with 35,000 sq ft minimum lots.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/609"
  },

  // Standard Single-Family Zones
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "R1-18",
    districtName: "R1-18 Single-Family Residence District",
    frontSetback: 20,
    sideSetback: 5,
    rearSetback: 15,
    lotCoverageMax: 0.40,
    maxHeight: 30,
    maxStories: 2,
    minLotSize: 18000,
    minLotWidth: 100,
    minLotDepth: 125,
    aduAllowed: true,
    maxADUs: 2,
    description: "Single-family residential with 18,000 sq ft minimum lots.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/610"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "R1-14",
    districtName: "Residential R1-14 District—One-Family Residence",
    frontSetback: 20,
    sideSetback: 5,
    rearSetback: 15,
    lotCoverageMax: 0.40,
    maxHeight: 30,
    maxStories: 2,
    minLotSize: 14000,
    minLotWidth: 90,
    minLotDepth: 125,
    aduAllowed: true,
    maxADUs: 2,
    description: "Single-family residential with 14,000 sq ft minimum lots.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/607"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "R1-10",
    districtName: "R1-10 Single-Family Residence District",
    frontSetback: 20,
    sideSetback: 5,
    rearSetback: 15,
    lotCoverageMax: 0.40,
    maxHeight: 30,
    maxStories: 2,
    minLotSize: 10000,
    minLotWidth: 70,
    minLotDepth: 120,
    aduAllowed: true,
    maxADUs: 2,
    description: "Single and multi-family residential with 10,000 sq ft minimum lots.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/611"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "R1-8",
    districtName: "R1-8 Single-Family Residence District",
    frontSetback: 20,
    sideSetback: 5,
    rearSetback: 15,
    lotCoverageMax: 0.40,
    maxHeight: 30,
    maxStories: 2,
    minLotSize: 8000,
    minLotWidth: 60,
    minLotDepth: 120,
    aduAllowed: true,
    maxADUs: 2,
    description: "Single and multi-family residential with 8,000 sq ft minimum lots.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/612"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "R1-6",
    districtName: "R1-6 Single-Family Residence District",
    frontSetback: 20,
    sideSetback: 5,
    rearSetback: 15,
    lotCoverageMax: 0.40,
    maxHeight: 30,
    maxStories: 2,
    minLotSize: 6000,
    minLotWidth: 50,
    minLotDepth: 120,
    aduAllowed: true,
    maxADUs: 2,
    aduMinSetback: 3,
    aduMaxSize: 1000,
    aduMaxHeight: 18,
    parkingPerUnit: 2.0,
    coveredParking: false,
    fenceMaxHeight: 6,
    landscapeReq: "Front yard landscaping required per Section 703",
    permittedUses: JSON.stringify([
      "Single-family dwelling",
      "Accessory dwelling units (up to 2)",
      "Two-family dwelling",
      "Home occupations",
      "Group homes (up to 10 persons)",
      "Private swimming pools",
      "Community gardens"
    ]),
    specialRules: "Up to 2 ADUs allowed by right. Buildings and accessory structures shall not occupy more than 40% of net lot area. Corner lots may have reduced side setback of 3 feet on one side.",
    description: "Single and multi-family residential with 6,000 sq ft minimum lots.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/613"
  },

  // Multifamily Zones
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "R-2",
    districtName: "R-2 Multifamily Residence District",
    frontSetback: 20,
    sideSetback: 10,
    rearSetback: 15,
    lotCoverageMax: 0.50,
    maxHeight: 36,
    maxStories: 3,
    minLotSize: 6000,
    aduAllowed: false,
    description: "Multifamily residence limited. Varies by development option.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/614"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "R-3",
    districtName: "R-3 Multifamily Residence District",
    frontSetback: 20,
    sideSetback: 10,
    rearSetback: 15,
    lotCoverageMax: 0.50,
    maxHeight: 48,
    maxStories: 4,
    minLotSize: 6000,
    aduAllowed: false,
    description: "Multifamily residence restricted. Varies by development option.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/615"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "R-3A",
    districtName: "R-3A Multifamily Residence District",
    frontSetback: 20,
    sideSetback: 10,
    rearSetback: 15,
    lotCoverageMax: 0.50,
    maxHeight: 48,
    maxStories: 4,
    minLotSize: 6000,
    aduAllowed: false,
    description: "Multifamily residence limited.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/616"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "R-4",
    districtName: "R-4 Multifamily Residence District",
    frontSetback: 20,
    sideSetback: 10,
    rearSetback: 15,
    lotCoverageMax: 0.60,
    maxHeight: 60,
    maxStories: 5,
    minLotSize: 6000,
    aduAllowed: false,
    description: "Multifamily residence limited.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/617"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "R-4A",
    districtName: "Residential R-4A District—Multifamily Residence—General",
    frontSetback: 20,
    sideSetback: 10,
    rearSetback: 15,
    lotCoverageMax: 0.60,
    maxHeight: 60,
    maxStories: 5,
    minLotSize: 6000,
    aduAllowed: false,
    description: "Multifamily residence general.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/619"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "R-5",
    districtName: "R-5 Multifamily Residence District—Restricted Commercial",
    frontSetback: 25,
    sideSetback: 10,
    rearSetback: 15,
    lotCoverageMax: 0.60,
    maxHeight: 75,
    maxStories: 6,
    minLotSize: 6000,
    aduAllowed: false,
    description: "Multifamily residence general with restricted commercial.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/618"
  },

  // Special Residential Zones
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "R-I",
    districtName: "Residential Infill R-I District—Multifamily Residential",
    frontSetback: 15,
    sideSetback: 5,
    rearSetback: 10,
    lotCoverageMax: 0.60,
    maxHeight: 48,
    maxStories: 4,
    minLotSize: 5000,
    aduAllowed: true,
    maxADUs: 2,
    aduMinSetback: 3,
    aduMaxSize: 800,
    aduMaxHeight: 18,
    parkingPerUnit: 1.5,
    coveredParking: false,
    fenceMaxHeight: 6,
    landscapeReq: "Urban landscaping standards per Section 703",
    permittedUses: JSON.stringify([
      "Single-family dwelling",
      "Two-family dwelling",
      "Multifamily dwelling",
      "Accessory dwelling units",
      "Townhouses",
      "Live-work units",
      "Community facilities",
      "Urban gardens"
    ]),
    specialRules: "Designed for urban infill and transit-oriented development. Reduced parking requirements in transit corridors. Height bonuses available for affordable housing components. Pedestrian-oriented design standards apply.",
    description: "Residential infill for multifamily development in urban core areas.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/630"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "R-O",
    districtName: "Residential Office R-O District—Restricted Commercial",
    frontSetback: 25,
    sideSetback: 10,
    rearSetback: 15,
    lotCoverageMax: 0.50,
    maxHeight: 48,
    maxStories: 4,
    minLotSize: 6000,
    aduAllowed: false,
    description: "Residential with restricted commercial office uses.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/620"
  },

  // Suburban Zones
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "S-1",
    districtName: "Suburban S-1 District—Ranch or Farm Residence",
    frontSetback: 40,
    sideSetback: 40,
    rearSetback: 40,
    lotCoverageMax: 0.15,
    maxHeight: 30,
    maxStories: 2,
    minLotSize: 87120, // 2 acres
    minLotWidth: 200,
    minLotDepth: 200,
    aduAllowed: true,
    maxADUs: 1,
    description: "Ranch or farm residence with 2-acre minimum lots.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/603"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "S-2",
    districtName: "Suburban S-2 District—Ranch or Farm Commercial",
    frontSetback: 40,
    sideSetback: 40,
    rearSetback: 40,
    lotCoverageMax: 0.25,
    maxHeight: 36,
    maxStories: 3,
    minLotSize: 87120, // 2 acres
    minLotWidth: 200,
    minLotDepth: 200,
    aduAllowed: false,
    description: "Ranch or farm commercial with 2-acre minimum lots.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/604"
  },

  // High-Rise Zones
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "H-R",
    districtName: "High-Rise H-R District—High-Rise and High Density District",
    frontSetback: 25,
    sideSetback: 15,
    rearSetback: 15,
    lotCoverageMax: 0.70,
    maxHeight: 250,
    maxStories: 20,
    minLotSize: 10000,
    aduAllowed: false,
    description: "High-rise and high density mixed-use development.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/631"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "H-R1",
    districtName: "High-Rise H-R1 District—High-Rise and High Density District",
    frontSetback: 25,
    sideSetback: 15,
    rearSetback: 15,
    lotCoverageMax: 0.70,
    maxHeight: 250,
    maxStories: 20,
    minLotSize: 10000,
    aduAllowed: false,
    description: "High-rise and high density mixed-use development, variant.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/632"
  },
  {
    jurisdiction: "Phoenix, AZ",
    zoningDistrict: "UR",
    districtName: "Urban Residential (UR) District",
    frontSetback: 0,
    sideSetback: 0,
    rearSetback: 0,
    lotCoverageMax: null, // No maximum
    maxHeight: 75,
    maxStories: 6,
    minLotSize: 5000,
    aduAllowed: true,
    maxADUs: 2,
    description: "Urban residential for mixed-use development with pedestrian orientation.",
    sourceUrl: "https://phoenix.municipal.codes/ZO/642"
  }
]

async function main() {
  console.log('🌵 Seeding Phoenix zoning districts...')

  for (const zone of phoenixZoning) {
    await prisma.phoenixZoning.upsert({
      where: {
        jurisdiction_zoningDistrict: {
          jurisdiction: zone.jurisdiction,
          zoningDistrict: zone.zoningDistrict
        }
      },
      update: zone,
      create: zone
    })
    console.log(`✅ ${zone.zoningDistrict}: ${zone.districtName}`)
  }

  console.log(`\n✨ Successfully seeded ${phoenixZoning.length} Phoenix zoning districts!`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding zoning data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
