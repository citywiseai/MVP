/**
 * List all projects to find IDs for testing
 *
 * Usage: npx tsx scripts/list-projects.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Fetching all projects...\n');

  const projects = await prisma.project.findMany({
    include: {
      roadmap: true,
      tasks: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (projects.length === 0) {
    console.log('📭 No projects found in database');
    console.log('\n💡 Create a project through Scout to test the roadmap feature');
    process.exit(0);
  }

  console.log(`Found ${projects.length} project(s):\n`);

  projects.forEach((project, index) => {
    const hasRoadmap = !!project.roadmap;
    const roadmapIcon = hasRoadmap ? '🗺️ ' : '❌';

    console.log(`${index + 1}. ${roadmapIcon} ${project.name}`);
    console.log(`   ID: ${project.id}`);
    console.log(`   Type: ${project.projectType || 'N/A'}`);
    console.log(`   Tasks: ${project.tasks.length}`);
    console.log(`   Roadmap: ${hasRoadmap ? 'Yes ✅' : 'No ❌'}`);

    if (hasRoadmap && project.roadmap) {
      const phases = project.roadmap.phases as any;
      console.log(`   Progress: ${project.roadmap.overallProgress}%`);
      console.log(`   Phases: ${phases.length}`);
      console.log(
        `   Current: ${phases.find((p: any) => p.id === project.roadmap?.currentPhaseId)?.name || 'N/A'}`
      );
    }

    console.log(`   URL: http://localhost:3000/projects/${project.id}`);
    console.log('');
  });

  console.log('─'.repeat(60));
  console.log('\n💡 To generate a roadmap for a project without one:');
  console.log('   npx tsx scripts/test-roadmap.ts <projectId>');
  console.log('\n💡 To view a project with roadmap:');
  console.log('   http://localhost:3000/projects/<projectId>');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
