import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Phoenix requirements...');

  // Create Phoenix jurisdiction
  const phoenix = await prisma.jurisdiction.upsert({
    where: { name: 'Phoenix' },
    update: {},
    create: {
      name: 'Phoenix',
      fullName: 'City of Phoenix',
      state: 'Arizona',
      phone: '(602) 262-7811',
      website: 'https://www.phoenix.gov',
      permitPortalUrl: 'https://apps-secure.phoenix.gov/PDD',
      typicalReviewDays: 14,
      expressPermitDays: 1,
    },
  });

  console.log(`✅ Phoenix jurisdiction`);

  // Create requirements
  const planReview = await prisma.municipalRequirement.upsert({
    where: { jurisdictionId_name: { jurisdictionId: phoenix.id, name: 'Plan Review' } },
    update: {},
    create: {
      jurisdictionId: phoenix.id,
      name: 'Plan Review',
      type: 'REVIEW',
      description: 'Full architectural plan review by Phoenix P&D staff. Required when projects exceed thresholds or involve complex construction.',
      appliesToProjectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
      typicalTimeframe: '1-3 weeks',
      providedBy: 'City of Phoenix Planning & Development',
    },
  });

  const otcPermit = await prisma.municipalRequirement.upsert({
    where: { jurisdictionId_name: { jurisdictionId: phoenix.id, name: 'Over-the-Counter Permit' } },
    update: {},
    create: {
      jurisdictionId: phoenix.id,
      name: 'Over-the-Counter Permit',
      type: 'PERMIT',
      description: 'Express permit issued same-day for simple projects meeting prescriptive code requirements.',
      appliesToProjectTypes: ['ADDITION', 'REMODEL', 'PATIO_COVER'],
      typicalTimeframe: 'Same day',
      providedBy: 'City of Phoenix',
    },
  });

  const structuralEng = await prisma.municipalRequirement.upsert({
    where: { jurisdictionId_name: { jurisdictionId: phoenix.id, name: 'Structural Engineering' } },
    update: {},
    create: {
      jurisdictionId: phoenix.id,
      name: 'Structural Engineering',
      type: 'ENGINEERING',
      description: 'Sealed structural calculations and plans from Arizona-licensed structural engineer.',
      appliesToProjectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
      typicalCostRange: '$2,000-$8,000',
      providedBy: 'Licensed Structural Engineer',
    },
  });

  const buildingPermit = await prisma.municipalRequirement.upsert({
    where: { jurisdictionId_name: { jurisdictionId: phoenix.id, name: 'Building Permit' } },
    update: {},
    create: {
      jurisdictionId: phoenix.id,
      name: 'Building Permit',
      type: 'PERMIT',
      description: 'Standard building permit issued after plan approval.',
      appliesToProjectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION', 'PATIO_COVER'],
      providedBy: 'City of Phoenix',
    },
  });

  const plumbingPermit = await prisma.municipalRequirement.upsert({
    where: { jurisdictionId_name: { jurisdictionId: phoenix.id, name: 'Plumbing Permit' } },
    update: {},
    create: {
      jurisdictionId: phoenix.id,
      name: 'Plumbing Permit',
      type: 'PERMIT',
      description: 'Required when moving or adding plumbing fixtures.',
      appliesToProjectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
      providedBy: 'City of Phoenix',
    },
  });

  const electricalPermit = await prisma.municipalRequirement.upsert({
    where: { jurisdictionId_name: { jurisdictionId: phoenix.id, name: 'Electrical Permit' } },
    update: {},
    create: {
      jurisdictionId: phoenix.id,
      name: 'Electrical Permit',
      type: 'PERMIT',
      description: 'Required when adding or modifying electrical systems.',
      appliesToProjectTypes: ['ADDITION', 'REMODEL', 'ADU', 'NEW_CONSTRUCTION'],
      providedBy: 'City of Phoenix',
    },
  });

  const survey = await prisma.municipalRequirement.upsert({
    where: { jurisdictionId_name: { jurisdictionId: phoenix.id, name: 'Property Survey' } },
    update: {},
    create: {
      jurisdictionId: phoenix.id,
      name: 'Property Survey',
      type: 'STUDY',
      description: 'Professional land survey showing property boundaries and setbacks.',
      appliesToProjectTypes: ['ADU', 'NEW_CONSTRUCTION'],
      typicalCostRange: '$400-$800',
      providedBy: 'Licensed Land Surveyor',
    },
  });

  console.log(`✅ 7 requirements`);

  // Create rules
  await prisma.requirementRule.create({
    data: {
      jurisdictionId: phoenix.id,
      name: 'Addition Over 500 SF',
      description: 'Additions exceeding 500 SF require plan review.',
      projectTypes: ['ADDITION'],
      requirementId: planReview.id,
      sourceDocument: 'phoenix.gov/pdd - Residential OTC Permits Guideline',
      triggers: {
        create: [{
          fieldName: 'square_footage',
          operator: 'GREATER_THAN',
          value: '500',
          description: 'Square footage greater than 500',
        }],
      },
    },
  });

  await prisma.requirementRule.create({
    data: {
      jurisdictionId: phoenix.id,
      name: 'Small Addition OTC',
      description: 'Single level additions ≤500 SF with no structural changes qualify for OTC.',
      projectTypes: ['ADDITION'],
      requirementId: otcPermit.id,
      triggers: {
        create: [
          {
            fieldName: 'square_footage',
            operator: 'LESS_THAN_OR_EQUAL',
            value: '500',
            description: 'Square footage 500 or less',
          },
          {
            fieldName: 'structural_changes',
            operator: 'EQUALS',
            value: 'false',
            description: 'No structural changes',
          },
        ],
      },
    },
  });

  await prisma.requirementRule.create({
    data: {
      jurisdictionId: phoenix.id,
      name: 'Structural Changes Require Engineering',
      description: 'Any structural work requires structural engineering.',
      projectTypes: ['ADDITION', 'REMODEL'],
      requirementId: structuralEng.id,
      triggers: {
        create: [{
          fieldName: 'structural_changes',
          operator: 'EQUALS',
          value: 'true',
          description: 'Structural changes present',
        }],
      },
    },
  });

  await prisma.requirementRule.create({
    data: {
      jurisdictionId: phoenix.id,
      name: 'ADU Requires Plan Review',
      description: 'All ADUs require full plan review.',
      projectTypes: ['ADU'],
      requirementId: planReview.id,
      triggers: {
        create: [{
          fieldName: 'project_type',
          operator: 'EQUALS',
          value: 'ADU',
          description: 'Project is ADU',
        }],
      },
    },
  });

  await prisma.requirementRule.create({
    data: {
      jurisdictionId: phoenix.id,
      name: 'ADU Requires Structural Engineering',
      description: 'ADUs require structural engineering.',
      projectTypes: ['ADU'],
      requirementId: structuralEng.id,
      triggers: {
        create: [{
          fieldName: 'project_type',
          operator: 'EQUALS',
          value: 'ADU',
          description: 'Project is ADU',
        }],
      },
    },
  });

  await prisma.requirementRule.create({
    data: {
      jurisdictionId: phoenix.id,
      name: 'ADU Requires Survey',
      description: 'ADUs require property survey.',
      projectTypes: ['ADU'],
      requirementId: survey.id,
      triggers: {
        create: [{
          fieldName: 'project_type',
          operator: 'EQUALS',
          value: 'ADU',
          description: 'Project is ADU',
        }],
      },
    },
  });

  await prisma.requirementRule.create({
    data: {
      jurisdictionId: phoenix.id,
      name: 'Plumbing Work Requires Permit',
      description: 'Moving or adding plumbing fixtures requires permit.',
      projectTypes: ['ADDITION', 'REMODEL', 'ADU'],
      requirementId: plumbingPermit.id,
      triggers: {
        create: [{
          fieldName: 'plumbing_work',
          operator: 'EQUALS',
          value: 'true',
          description: 'Plumbing work involved',
        }],
      },
    },
  });

  await prisma.requirementRule.create({
    data: {
      jurisdictionId: phoenix.id,
      name: 'Electrical Work Requires Permit',
      description: 'Adding or modifying electrical requires permit.',
      projectTypes: ['ADDITION', 'REMODEL', 'ADU'],
      requirementId: electricalPermit.id,
      triggers: {
        create: [{
          fieldName: 'electrical_work',
          operator: 'EQUALS',
          value: 'true',
          description: 'Electrical work involved',
        }],
      },
    },
  });

  console.log(`✅ 8 rules`);
  console.log('🎉 Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
