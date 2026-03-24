import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROJECT_PHASES = [
  { order: 1, name: "Discovery", duration: "2-4 weeks", description: "Initial site assessment and data collection" },
  { order: 2, name: "Design", duration: "3-6 weeks", description: "Architectural design and preliminary plans" },
  { order: 3, name: "Engineering", duration: "4-6 weeks", description: "Engineering calculations and compliance verification" },
  { order: 4, name: "Permit Submission", duration: "1-2 weeks", description: "Compile and submit permit application package" },
  { order: 5, name: "City Review", duration: "4-12 weeks", description: "City plan check and review process" },
  { order: 6, name: "Approval", duration: "1-2 weeks", description: "Permit approved and ready for construction" },
];

const PHASE_STATUS = {
  WAITING: "waiting",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SKIPPED: "skipped",
};

async function fixProjectRoadmap(projectId: string) {
  console.log(`🔧 Fixing roadmap for project: ${projectId}\n`);

  try {
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        roadmap: {
          include: {
            phases: true
          }
        }
      }
    });

    if (!project) {
      console.log('❌ Project not found:', projectId);
      return;
    }

    console.log('✅ Project found:', project.name);

    // Check if roadmap already exists
    if (project.roadmap) {
      console.log('📍 Roadmap exists:', project.roadmap.id);
      if (project.roadmap.phases.length > 0) {
        console.log(`✅ Roadmap already has ${project.roadmap.phases.length} phases - nothing to fix!`);
        return;
      }
      console.log('⚠️  Roadmap exists but has no phases - will create phases...');
    } else {
      console.log('📍 No roadmap exists - will create roadmap and phases...');
    }

    // Create roadmap if it doesn't exist
    let roadmapId = project.roadmap?.id;
    if (!roadmapId) {
      const roadmap = await prisma.projectRoadmap.create({
        data: {
          projectId: projectId,
        }
      });
      roadmapId = roadmap.id;
      console.log('✅ Roadmap created:', roadmapId);
    }

    // Create phases
    console.log(`\n📍 Creating ${PROJECT_PHASES.length} phases...`);
    for (const phase of PROJECT_PHASES) {
      const createdPhase = await prisma.roadmapPhase.create({
        data: {
          roadmapId: roadmapId,
          name: phase.name,
          order: phase.order,
          status: phase.order === 1 ? PHASE_STATUS.IN_PROGRESS : PHASE_STATUS.WAITING,
          estimatedDuration: phase.duration,
          description: phase.description,
          startDate: phase.order === 1 ? new Date() : null,
          services: [],
          dependencies: [],
        }
      });
      console.log(`  ✅ Phase ${phase.order}: ${phase.name} (${createdPhase.id})`);
    }

    console.log(`\n✅ Fixed roadmap for project: ${projectId}`);
    console.log(`   Created roadmap with ${PROJECT_PHASES.length} phases`);

  } catch (error) {
    console.error('❌ Error fixing roadmap:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

// Main execution
const projectId = process.argv[2];

if (!projectId) {
  console.log('❌ Error: Project ID required');
  console.log('\nUsage:');
  console.log('  npx tsx scripts/fix-project-roadmap.ts <project-id>');
  console.log('\nExample:');
  console.log('  npx tsx scripts/fix-project-roadmap.ts cm4abc123xyz');
  process.exit(1);
}

fixProjectRoadmap(projectId)
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
