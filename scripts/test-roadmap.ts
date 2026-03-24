/**
 * Test script to generate a roadmap for an existing project
 *
 * Usage:
 *   npx tsx scripts/test-roadmap.ts <projectId>
 *
 * Example:
 *   npx tsx scripts/test-roadmap.ts cm12345abc
 */

import { PrismaClient } from '@prisma/client';
import { generateRoadmap } from '../lib/roadmap-generator';
import { ScoutProjectData } from '../types/roadmap';

const prisma = new PrismaClient();

async function main() {
  const projectId = process.argv[2];

  if (!projectId) {
    console.error('❌ Please provide a project ID');
    console.log('Usage: npx tsx scripts/test-roadmap.ts <projectId>');
    process.exit(1);
  }

  console.log('🔍 Fetching project:', projectId);

  // Fetch the project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      roadmap: true,
      tasks: true,
    },
  });

  if (!project) {
    console.error('❌ Project not found');
    process.exit(1);
  }

  console.log('✅ Found project:', project.name);

  // Check if roadmap already exists
  if (project.roadmap) {
    console.log('⚠️  Roadmap already exists for this project');
    console.log('   Current progress:', project.roadmap.overallProgress + '%');
    console.log('   Phases:', (project.roadmap.phases as any).length);

    // Ask to regenerate
    const shouldRegenerate = process.argv.includes('--force');
    if (!shouldRegenerate) {
      console.log('\n💡 Use --force flag to regenerate the roadmap');
      process.exit(0);
    }

    console.log('🔄 Regenerating roadmap...');
    await prisma.projectRoadmap.delete({
      where: { id: project.roadmap.id },
    });
  }

  // Create sample Scout data from project
  const scoutData: ScoutProjectData = {
    projectType: project.projectType || 'Addition',
    description: project.description || 'Residential project',
    scopeOfWork: project.description || '',
    squareFootage: 1000, // Default
    engineeringNeeds: {
      structural: project.tasks.some((t) =>
        t.title.toLowerCase().includes('structural')
      ),
      civil: project.projectType === 'New Build',
      electrical: project.tasks.some((t) =>
        t.title.toLowerCase().includes('electrical')
      ),
      plumbing: project.tasks.some((t) =>
        t.title.toLowerCase().includes('plumbing')
      ),
      mechanical: project.tasks.some((t) => t.title.toLowerCase().includes('hvac')),
    },
    keyDetails: {
      movingWalls: project.tasks.some((t) => t.title.toLowerCase().includes('wall')),
      panelUpgrade: project.tasks.some((t) =>
        t.title.toLowerCase().includes('panel')
      ),
      plumbingRelocation: project.tasks.some((t) =>
        t.title.toLowerCase().includes('plumbing')
      ),
      hvacWork: project.tasks.some((t) => t.title.toLowerCase().includes('hvac')),
    },
  };

  console.log('🗺️  Generating roadmap...');
  console.log('   Project type:', scoutData.projectType);
  console.log('   Square footage:', scoutData.squareFootage);
  console.log('   Engineering needs:', scoutData.engineeringNeeds);

  // Generate roadmap
  const roadmapData = generateRoadmap(project.id, scoutData, {
    estimatedStartDate: new Date(),
    prioritizeSpeed: false,
  });

  console.log('✅ Roadmap generated with', roadmapData.phases.length, 'phases:');
  roadmapData.phases.forEach((phase, index) => {
    console.log(`   ${index + 1}. ${phase.name} (${phase.services.length} services)`);
  });

  // Save to database
  const savedRoadmap = await prisma.projectRoadmap.create({
    data: {
      projectId: project.id,
      phases: roadmapData.phases as any,
      currentPhaseId: roadmapData.currentPhaseId,
      overallProgress: roadmapData.overallProgress,
      estimatedCompletionDate: roadmapData.estimatedCompletionDate,
    },
  });

  console.log('\n🎉 Roadmap saved successfully!');
  console.log('   Roadmap ID:', savedRoadmap.id);
  console.log('   View at: http://localhost:3000/projects/' + project.id);
  console.log('   Direct roadmap: http://localhost:3000/projects/' + project.id + '/roadmap');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
