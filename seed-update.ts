import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Update or create user with your actual email
  const user = await prisma.user.upsert({
    where: { email: 'demo@rezio.dev' }, // Change this to your actual login email if different
    update: {},
    create: {
      email: 'demo@rezio.dev',
      name: 'Demo User',
    },
  })

  // Create demo org
  const org = await prisma.org.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
    },
  })

  // Create membership
  await prisma.membership.upsert({
    where: { userId_orgId: { userId: user.id, orgId: org.id } },
    update: {},
    create: {
      userId: user.id,
      orgId: org.id,
      role: 'OWNER',
    },
  })

  console.log('User connected to org successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
