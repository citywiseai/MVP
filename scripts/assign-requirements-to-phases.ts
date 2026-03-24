import { PrismaClient } from '@prisma/client';
import { suggestPhaseForTask } from '../lib/phases';

const prisma = new PrismaClient();

async function assignRequirementsToPhases() {
  console.log('Starting requirement-to-phase assignment...\n');

  try {
    // Get all tasks without a phaseId
    const tasks = await prisma.task.findMany({
      where: { phaseId: null },
      include: {
        project: {
          include: {
            roadmap: {
              include: {
                phases: {
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    console.log(`Found ${tasks.length} requirements without phase assignment\n`);

    let assigned = 0;
    let unassigned = 0;

    for (const task of tasks) {
      const suggestedPhaseOrder = suggestPhaseForTask(task.title);

      if (suggestedPhaseOrder && task.project?.roadmap?.phases) {
        // Find the matching phase record for this project
        const phase = task.project.roadmap.phases.find(p => p.order === suggestedPhaseOrder);

        if (phase) {
          await prisma.task.update({
            where: { id: task.id },
            data: { phaseId: phase.id }
          });
          console.log(`✅ "${task.title}" → Phase ${suggestedPhaseOrder}: ${phase.name}`);
          assigned++;
        } else {
          console.log(`⚠️  "${task.title}" → Phase ${suggestedPhaseOrder} suggested but not found in project`);
          unassigned++;
        }
      } else if (!task.project?.roadmap) {
        console.log(`⚠️  "${task.title}" → No roadmap exists for this project`);
        unassigned++;
      } else {
        console.log(`⚠️  "${task.title}" → No matching phase keywords found, leaving unassigned`);
        unassigned++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   - Assigned: ${assigned} requirements`);
    console.log(`   - Unassigned: ${unassigned} requirements`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

assignRequirementsToPhases();
