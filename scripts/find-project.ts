import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const searchTerm = process.argv[2] || '305 W Cardeno'

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { fullAddress: { contains: searchTerm, mode: 'insensitive' } },
        { name: { contains: searchTerm, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      fullAddress: true,
      parcelId: true
    }
  })

  console.log(`\nFound ${projects.length} projects matching "${searchTerm}":\n`)

  projects.forEach(p => {
    console.log(`ID: ${p.id}`)
    console.log(`Name: ${p.name}`)
    console.log(`Address: ${p.fullAddress}`)
    console.log(`Parcel ID: ${p.parcelId || 'None'}`)
    console.log('')
  })

  await prisma.$disconnect()
}

main()
