const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Create a demo user with the mocked session id
  await prisma.user.upsert({
    where: { id: 'user_demo_001' },
    update: {},
    create: {
      id: 'user_demo_001',
      email: 'demo@rezio.dev',
      name: 'Demo User',
    },
  })
  console.log('Demo user created or already exists.')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(() => prisma.$disconnect())
