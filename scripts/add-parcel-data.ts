import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create parcel for Redfield address
  const redfieldParcel = await prisma.parcel.create({
    data: {
      apn: '217-22-023',
      address: '4747 E Redfield Rd, Phoenix, AZ 85032',
      jurisdiction: 'City of Phoenix',
      zoningCode: 'R1-6',
      lotSizeSqFt: 8500,
      latitude: 33.6723,
      longitude: -112.0126,
      zoningRules: [
        { field: 'front_setback_ft', value: '20', unit: 'ft' },
        { field: 'rear_setback_ft', value: '15', unit: 'ft' },
        { field: 'side_setback_ft', value: '5', unit: 'ft' },
        { field: 'max_height_ft', value: '30', unit: 'ft' }
      ]
    }
  })

  // Create parcel for Mercer address
  const mercerParcel = await prisma.parcel.create({
    data: {
      apn: '345-67-890',
      address: '2537 E Mercer Ln, Phoenix, AZ 85028',
      jurisdiction: 'City of Phoenix',
      zoningCode: 'R1-8',
      lotSizeSqFt: 10000,
      latitude: 33.6145,
      longitude: -112.0445,
      zoningRules: [
        { field: 'front_setback_ft', value: '25', unit: 'ft' },
        { field: 'rear_setback_ft', value: '20', unit: 'ft' },
        { field: 'side_setback_ft', value: '8', unit: 'ft' },
        { field: 'max_height_ft', value: '30', unit: 'ft' }
      ]
    }
  })

  // Link parcels to existing projects by address
  await prisma.project.updateMany({
    where: {
      fullAddress: { contains: 'Redfield' }
    },
    data: {
      parcelId: redfieldParcel.id
    }
  })

  await prisma.project.updateMany({
    where: {
      fullAddress: { contains: 'Mercer' }
    },
    data: {
      parcelId: mercerParcel.id
    }
  })

  console.log('✅ Parcel data added and linked to projects')
  console.log(`Redfield Parcel ID: ${redfieldParcel.id}`)
  console.log(`Mercer Parcel ID: ${mercerParcel.id}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
