const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkProjects() {
  try {
    const projects = await prisma.project.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        fullAddress: true
      }
    })
    
    console.log('Projects found:', projects.length)
    projects.forEach(project => {
      console.log(`- ${project.id}: ${project.name} (${project.fullAddress})`)
    })
    
    if (projects.length === 0) {
      console.log('No projects found in database')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProjects()