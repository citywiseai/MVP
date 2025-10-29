import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // CORRECT coordinates for 4747 E Redfield Rd, Phoenix, AZ 85032
  await prisma.parcel.updateMany({
    where: {
      address: { contains: 'Redfield' }
    },
    data: {
      latitude: 33.614843,
      longitude: -111.978637
    }
  })

  console.log('✅ Redfield coordinates updated to correct location')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
