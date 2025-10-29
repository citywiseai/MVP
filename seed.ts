import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')
  
  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@rezio.dev' },
    update: {},
    create: {
      id: 'user_demo_001',
      email: 'demo@rezio.dev',
      name: 'Demo User',
      updatedAt: new Date(),
    },
  })

  // Create demo org
  const org = await prisma.org.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      id: 'org_demo_001',
      name: 'Demo Organization',
      slug: 'demo-org',
      updatedAt: new Date(),
    },
  })

  // Create membership
  await prisma.membership.upsert({
    where: { userId_orgId: { userId: user.id, orgId: org.id } },
    update: {},
    create: {
      id: 'membership_demo_001',
      userId: user.id,
      orgId: org.id,
      role: 'OWNER',
    },
  })

  // Create demo projects (both demo and current)
  const demoProjects = [
    {
      id: 'cmggxlgwl0001bt3zs5atpye0',
      name: 'Demo Real Estate Project',
      description: 'A sample residential development project with multiple units.',
      status: 'active',
      orgId: org.id,
      userId: user.id,
      updatedAt: new Date(),
    },
    {
      id: 'cmgjxuoex0001bt90wssz3o9m',
      name: 'Your Current Project',
      description: 'This is your current project with seeded requirements, tasks, and notes.',
      status: 'active',
      orgId: org.id,
      userId: user.id,
      updatedAt: new Date(),
    }
  ];
  for (const proj of demoProjects) {
    await prisma.project.upsert({
      where: { id: proj.id },
      update: {},
      create: proj,
    });
  }

  // Seed requirements, tasks, and notes for both projects
  for (const proj of demoProjects) {
    // Add some engineering requirements
    await prisma.engineeringRequirement.createMany({
      data: [
        {
          id: `req_001_${proj.id}`,
          requirement: 'Foundation design must accommodate soil conditions',
          projectId: proj.id,
        },
        {
          id: `req_002_${proj.id}`,
          requirement: 'HVAC system must meet energy efficiency standards',
          projectId: proj.id,
        },
        {
          id: `req_003_${proj.id}`,
          requirement: 'Fire safety systems per local building codes',
          projectId: proj.id,
        },
      ],
      skipDuplicates: true,
    });

    // Add some tasks
    await prisma.task.createMany({
      data: [
        {
          id: `task_001_${proj.id}`,
          title: 'Site Survey and Analysis',
          description: 'Complete topographical and soil analysis',
          projectId: proj.id,
          status: 'COMPLETED',
          userId: user.id,
        },
        {
          id: `task_002_${proj.id}`,
          title: 'Preliminary Design Review',
          description: 'Review initial architectural plans',
          projectId: proj.id,
          status: 'IN_PROGRESS',
          userId: user.id,
        },
        {
          id: `task_003_${proj.id}`,
          title: 'Permit Applications',
          description: 'Submit building permits to city',
          projectId: proj.id,
          status: 'TODO',
          userId: user.id,
        },
      ],
      skipDuplicates: true,
    });

    // Add some notes
    await prisma.note.createMany({
      data: [
        {
          id: `note_001_${proj.id}`,
          content: 'Initial site visit completed. Soil conditions appear favorable for standard foundation.',
          projectId: proj.id,
          userId: user.id,
        },
        {
          id: `note_002_${proj.id}`,
          content: 'Meeting with city planning department scheduled for next week to discuss zoning requirements.',
          projectId: proj.id,
          userId: user.id,
        },
      ],
      skipDuplicates: true,
    });
  }

  // (Old single-project seeding code removed; now handled in loop above)

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
