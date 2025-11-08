import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  // Test 1: 600 SF Addition with structural changes
  console.log('\n🧪 Test: 600 SF Addition with structural changes in Phoenix\n');
  
  const rules = await prisma.requirementRule.findMany({
    where: {
      jurisdiction: { name: 'Phoenix' },
      projectTypes: { has: 'ADDITION' },
      isActive: true,
    },
    include: {
      requirement: true,
      triggers: true,
    },
  });

  const project = {
    square_footage: 600,
    structural_changes: 'true',
    plumbing_work: 'true',
  };

  console.log('📋 Requirements triggered:\n');

  for (const rule of rules) {
    const allPass = rule.triggers.every(t => {
      const val = project[t.fieldName as keyof typeof project];
      if (t.operator === 'GREATER_THAN') return Number(val) > Number(t.value);
      if (t.operator === 'LESS_THAN_OR_EQUAL') return Number(val) <= Number(t.value);
      if (t.operator === 'EQUALS') return String(val) === String(t.value);
      return false;
    });

    if (allPass) {
      console.log(`✅ ${rule.requirement.name}`);
      console.log(`   → ${rule.description}`);
      if (rule.requirement.typicalTimeframe) {
        console.log(`   ⏱️  ${rule.requirement.typicalTimeframe}`);
      }
      if (rule.requirement.typicalCostRange) {
        console.log(`   💰 ${rule.requirement.typicalCostRange}`);
      }
      console.log('');
    }
  }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
