import { PrismaClient } from '@prisma/client';
import { PROJECT_PHASES } from '../lib/phases';

const prisma = new PrismaClient();

async function migratePhaseNames() {
  console.log('Starting phase name migration...\n');

  try {
    // Get all roadmaps with their phases
    const roadmaps = await prisma.projectRoadmap.findMany({
      include: {
        phases: {
          orderBy: { order: 'asc' }
        },
        project: {
          select: { name: true }
        }
      }
    });

    console.log(`Found ${roadmaps.length} roadmap(s) to update\n`);

    let totalUpdated = 0;

    for (const roadmap of roadmaps) {
      console.log(`Project: ${roadmap.project.name}`);

      for (const phase of roadmap.phases) {
        const template = PROJECT_PHASES.find(p => p.order === phase.order);

        if (template) {
          const oldName = phase.name;

          await prisma.roadmapPhase.update({
            where: { id: phase.id },
            data: {
              name: template.name,
              description: template.description,
              estimatedDuration: template.duration,
            }
          });

          console.log(`  ✓ Phase ${phase.order}: "${oldName}" → "${template.name}"`);
          totalUpdated++;
        } else {
          console.log(`  ⚠ Phase ${phase.order}: No template found (skipped)`);
        }
      }
      console.log('');
    }

    console.log(`\n✅ Migration complete! Updated ${totalUpdated} phase(s) across ${roadmaps.length} roadmap(s).`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migratePhaseNames();
