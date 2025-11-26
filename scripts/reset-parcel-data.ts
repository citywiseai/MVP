import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetParcelData() {
  try {
    const apn = '16630141';

    console.log(`🔄 Resetting cached assessor data for parcel APN: ${apn}`);

    const result = await prisma.parcel.updateMany({
      where: {
        apn: apn
      },
      data: {
        totalBuildingSF: null,
        buildingSections: null,
        buildingSketchesImage: null,
        assessorDataFetchedAt: null,
        assessorUrl: null
      }
    });

    console.log(`✅ Reset ${result.count} parcel(s) with APN ${apn}`);
    console.log('   - totalBuildingSF: null');
    console.log('   - buildingSections: null');
    console.log('   - buildingSketchesImage: null');
    console.log('   - assessorDataFetchedAt: null');
    console.log('   - assessorUrl: null');
    console.log('\n💡 Next project load will auto-fetch fresh assessor data');

  } catch (error) {
    console.error('❌ Error resetting parcel data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetParcelData();
