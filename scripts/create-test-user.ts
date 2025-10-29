import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.create({
    data: {
      id: 'test-user-1',
      email: 'test@test.com',
      name: 'Test User',
      password: 'test123'
    }
  })
  
  console.log('✅ Created user:', user.email)
}

main()
