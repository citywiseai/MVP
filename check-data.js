const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      projectType: true,
      propertyType: true,
      buildingFootprintSqFt: true,
      lotSizeSqFt: true,
      jurisdiction: true
    }
  })
  console.log('Projects:', JSON.stringify(projects, null, 2))
  
  const requirements = await prisma.engineeringRequirement.findMany({
    select: {
      id: true,
      projectId: true,
      discipline: true,
      required: true,
      notes: true
    }
  })
  console.log('Requirements:', JSON.stringify(requirements, null, 2))
  
  await prisma.$disconnect()
}

main().catch(console.error)