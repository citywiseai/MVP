import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createDemoUser() {
  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@rezio.dev' }
    })

    if (existingUser) {
      console.log('Demo user already exists:', existingUser.email)
      return existingUser
    }

    // Create demo user
    const user = await prisma.user.create({
      data: {
        email: 'demo@rezio.dev',
        name: 'Demo User'
      }
    })

    console.log('Demo user created:', user.email)
    return user
  } catch (error) {
    console.error('Error creating demo user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDemoUser()