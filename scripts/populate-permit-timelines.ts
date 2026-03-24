import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMIT_TIMELINES = [
  // PHOENIX
  { jurisdiction: 'phoenix', permitType: 'residential_addition', planReviewDays: 15, revisionDays: 10, typicalRevisions: 2, approvalDays: 3, inspectionDays: 2, baseFee: 150, feePerSqFt: 0.50, expeditedAvailable: true, expeditedFee: 500, notes: 'Online tracking available. Same-day inspection scheduling.' },
  { jurisdiction: 'phoenix', permitType: 'adu', planReviewDays: 20, revisionDays: 10, typicalRevisions: 2, approvalDays: 3, inspectionDays: 2, baseFee: 200, feePerSqFt: 0.75, expeditedAvailable: true, expeditedFee: 750, notes: 'May require water/sewer capacity review.' },
  { jurisdiction: 'phoenix', permitType: 'new_construction', planReviewDays: 30, revisionDays: 15, typicalRevisions: 3, approvalDays: 5, inspectionDays: 2, baseFee: 500, feePerSqFt: 1.00, expeditedAvailable: true, expeditedFee: 1500, notes: 'Separate grading and utility permits required.' },
  { jurisdiction: 'phoenix', permitType: 'remodel', planReviewDays: 10, revisionDays: 7, typicalRevisions: 1, approvalDays: 2, inspectionDays: 2, baseFee: 100, feePerSqFt: 0.35, expeditedAvailable: true, expeditedFee: 300, notes: 'Interior-only remodels may qualify for over-the-counter.' },

  // CHANDLER
  { jurisdiction: 'chandler', permitType: 'residential_addition', planReviewDays: 10, revisionDays: 7, typicalRevisions: 1, approvalDays: 2, inspectionDays: 2, baseFee: 125, feePerSqFt: 0.45, expeditedAvailable: false, expeditedFee: null, notes: 'Typically faster review than Phoenix. Online portal available.' },
  { jurisdiction: 'chandler', permitType: 'adu', planReviewDays: 15, revisionDays: 7, typicalRevisions: 2, approvalDays: 2, inspectionDays: 2, baseFee: 175, feePerSqFt: 0.65, expeditedAvailable: false, expeditedFee: null, notes: 'ADU program streamlined in 2023.' },
  { jurisdiction: 'chandler', permitType: 'new_construction', planReviewDays: 25, revisionDays: 10, typicalRevisions: 2, approvalDays: 3, inspectionDays: 2, baseFee: 450, feePerSqFt: 0.90, expeditedAvailable: false, expeditedFee: null, notes: 'Pre-application meeting recommended.' },
  { jurisdiction: 'chandler', permitType: 'remodel', planReviewDays: 7, revisionDays: 5, typicalRevisions: 1, approvalDays: 2, inspectionDays: 2, baseFee: 85, feePerSqFt: 0.30, expeditedAvailable: false, expeditedFee: null, notes: 'Simple remodels often same-day approval.' },

  // SCOTTSDALE
  { jurisdiction: 'scottsdale', permitType: 'residential_addition', planReviewDays: 20, revisionDays: 14, typicalRevisions: 2, approvalDays: 3, inspectionDays: 3, baseFee: 200, feePerSqFt: 0.65, expeditedAvailable: true, expeditedFee: 750, notes: 'Design review required in certain areas. Strict architectural standards.' },
  { jurisdiction: 'scottsdale', permitType: 'adu', planReviewDays: 25, revisionDays: 14, typicalRevisions: 2, approvalDays: 3, inspectionDays: 3, baseFee: 250, feePerSqFt: 0.85, expeditedAvailable: true, expeditedFee: 1000, notes: 'Desert preservation areas have additional requirements.' },
  { jurisdiction: 'scottsdale', permitType: 'new_construction', planReviewDays: 35, revisionDays: 21, typicalRevisions: 3, approvalDays: 5, inspectionDays: 3, baseFee: 600, feePerSqFt: 1.25, expeditedAvailable: true, expeditedFee: 2000, notes: 'NAOS requirements for desert lots. Pre-app meeting required.' },
  { jurisdiction: 'scottsdale', permitType: 'remodel', planReviewDays: 14, revisionDays: 10, typicalRevisions: 1, approvalDays: 2, inspectionDays: 3, baseFee: 150, feePerSqFt: 0.45, expeditedAvailable: true, expeditedFee: 400, notes: 'Historic district has additional review.' },

  // MESA
  { jurisdiction: 'mesa', permitType: 'residential_addition', planReviewDays: 12, revisionDays: 7, typicalRevisions: 1, approvalDays: 2, inspectionDays: 2, baseFee: 135, feePerSqFt: 0.48, expeditedAvailable: true, expeditedFee: 400, notes: 'Electronic plan review available.' },
  { jurisdiction: 'mesa', permitType: 'adu', planReviewDays: 18, revisionDays: 10, typicalRevisions: 2, approvalDays: 3, inspectionDays: 2, baseFee: 185, feePerSqFt: 0.70, expeditedAvailable: true, expeditedFee: 600, notes: 'ADU ordinance updated 2022. Pre-approved plans available.' },
  { jurisdiction: 'mesa', permitType: 'new_construction', planReviewDays: 28, revisionDays: 14, typicalRevisions: 2, approvalDays: 4, inspectionDays: 2, baseFee: 475, feePerSqFt: 0.95, expeditedAvailable: true, expeditedFee: 1200, notes: 'Fast-track program for qualifying projects.' },
  { jurisdiction: 'mesa', permitType: 'remodel', planReviewDays: 8, revisionDays: 5, typicalRevisions: 1, approvalDays: 2, inspectionDays: 2, baseFee: 90, feePerSqFt: 0.32, expeditedAvailable: true, expeditedFee: 250, notes: 'Over-the-counter available for minor work.' },

  // GILBERT
  { jurisdiction: 'gilbert', permitType: 'residential_addition', planReviewDays: 10, revisionDays: 7, typicalRevisions: 1, approvalDays: 2, inspectionDays: 2, baseFee: 140, feePerSqFt: 0.50, expeditedAvailable: true, expeditedFee: 450, notes: 'Efficient online portal. HOA approval required in most areas.' },
  { jurisdiction: 'gilbert', permitType: 'adu', planReviewDays: 15, revisionDays: 10, typicalRevisions: 2, approvalDays: 2, inspectionDays: 2, baseFee: 190, feePerSqFt: 0.72, expeditedAvailable: true, expeditedFee: 650, notes: 'Casita/guest house regulations apply.' },
  { jurisdiction: 'gilbert', permitType: 'new_construction', planReviewDays: 25, revisionDays: 12, typicalRevisions: 2, approvalDays: 3, inspectionDays: 2, baseFee: 480, feePerSqFt: 0.92, expeditedAvailable: true, expeditedFee: 1300, notes: 'Builder portal available for contractors.' },
  { jurisdiction: 'gilbert', permitType: 'remodel', planReviewDays: 7, revisionDays: 5, typicalRevisions: 1, approvalDays: 2, inspectionDays: 2, baseFee: 95, feePerSqFt: 0.35, expeditedAvailable: true, expeditedFee: 275, notes: 'Express permit for minor interior work.' },

  // TEMPE
  { jurisdiction: 'tempe', permitType: 'residential_addition', planReviewDays: 12, revisionDays: 8, typicalRevisions: 1, approvalDays: 2, inspectionDays: 2, baseFee: 130, feePerSqFt: 0.47, expeditedAvailable: true, expeditedFee: 425, notes: 'Sustainability incentives available.' },
  { jurisdiction: 'tempe', permitType: 'adu', planReviewDays: 18, revisionDays: 10, typicalRevisions: 2, approvalDays: 2, inspectionDays: 2, baseFee: 180, feePerSqFt: 0.68, expeditedAvailable: true, expeditedFee: 625, notes: 'ADU-friendly policies. Reduced fees for affordable units.' },
  { jurisdiction: 'tempe', permitType: 'new_construction', planReviewDays: 28, revisionDays: 14, typicalRevisions: 2, approvalDays: 4, inspectionDays: 2, baseFee: 460, feePerSqFt: 0.88, expeditedAvailable: true, expeditedFee: 1150, notes: 'Green building incentives. Infill development encouraged.' },
  { jurisdiction: 'tempe', permitType: 'remodel', planReviewDays: 8, revisionDays: 5, typicalRevisions: 1, approvalDays: 2, inspectionDays: 2, baseFee: 88, feePerSqFt: 0.30, expeditedAvailable: true, expeditedFee: 260, notes: 'Historic preservation overlay in some areas.' },
];

async function main() {
  console.log('⏱️  POPULATING PERMIT TIMELINES\n');

  let created = 0, updated = 0;

  for (const timeline of PERMIT_TIMELINES) {
    try {
      const existing = await prisma.permitTimeline.findFirst({
        where: { jurisdiction: timeline.jurisdiction, permitType: timeline.permitType }
      });

      if (existing) {
        await prisma.permitTimeline.update({ where: { id: existing.id }, data: timeline });
        updated++;
      } else {
        await prisma.permitTimeline.create({ data: timeline });
        created++;
      }

      const totalDays = timeline.planReviewDays + (timeline.revisionDays * timeline.typicalRevisions) + timeline.approvalDays;
      console.log(`✅ ${timeline.jurisdiction} - ${timeline.permitType}: ~${Math.ceil(totalDays/5)} weeks`);
    } catch (error) {
      console.error(`❌ ${timeline.jurisdiction} - ${timeline.permitType}:`, error);
    }
  }

  console.log(`\n📊 Created: ${created} | Updated: ${updated}`);
}

main()
  .then(() => console.log('\n🎉 Done!'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
