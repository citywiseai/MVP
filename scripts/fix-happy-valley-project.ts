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

async function fixHappyValleyProject() {
  console.log('🔧 Fixing Happy Valley project...\n');

  try {
    // Find the project by address or name
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { name: { contains: 'Happy Valley' } },
          { fullAddress: { contains: 'Happy Valley' } },
          { fullAddress: { contains: '10040 E Happy Valley' } }
        ]
      },
      include: {
        parcel: true,
        roadmap: {
          include: {
            phases: true
          }
        }
      }
    });

    if (!project) {
      console.log('❌ Project not found. Searching all projects with "Happy" or "Valley"...');
      const similarProjects = await prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: 'Happy' } },
            { name: { contains: 'Valley' } },
            { fullAddress: { contains: '85255' } }
          ]
        },
        select: {
          id: true,
          name: true,
          fullAddress: true,
        }
      });

      console.log('\nFound similar projects:');
      similarProjects.forEach(p => {
        console.log(`  - ${p.id}: ${p.name} (${p.fullAddress})`);
      });

      console.log('\nRun the script with a specific project ID:');
      console.log('  npx tsx scripts/fix-project-roadmap.ts <project-id>');
      return;
    }

    console.log('✅ Project found:');
    console.log(`   ID: ${project.id}`);
    console.log(`   Name: ${project.name}`);
    console.log(`   Address: ${project.fullAddress}`);

    // Check parcel data
    if (project.parcel) {
      console.log('\n📦 Parcel Info:');
      console.log(`   APN: ${project.parcel.apn}`);
      console.log(`   Zoning: ${project.parcel.zoning}`);
      console.log(`   Lot Size: ${project.parcel.lotSizeSqFt} sq ft`);
      console.log(`   City: ${project.parcel.city}`);
      console.log(`   Has boundary: ${!!project.parcel.boundaryCoordinates}`);

      if (project.parcel.boundaryCoordinates) {
        try {
          const coords = typeof project.parcel.boundaryCoordinates === 'string'
            ? JSON.parse(project.parcel.boundaryCoordinates)
            : project.parcel.boundaryCoordinates;

          console.log(`   Boundary points: ${Array.isArray(coords) ? coords.length : 'Invalid format'}`);
        } catch (e) {
          console.log(`   Boundary: Error parsing - ${e}`);
        }
      } else {
        console.log('   ⚠️  WARNING: No boundary coordinates - setbacks will not work!');
      }

      // Check Phoenix zoning data
      if (project.parcel.zoning) {
        const phoenixZoning = await prisma.phoenixZoning.findFirst({
          where: { zoningDistrict: project.parcel.zoning }
        });

        if (phoenixZoning) {
          console.log(`\n✅ Phoenix zoning data exists for ${project.parcel.zoning}`);
          console.log(`   Front setback: ${phoenixZoning.frontSetback || 'N/A'} ft`);
          console.log(`   Side setback: ${phoenixZoning.sideSetback || 'N/A'} ft`);
          console.log(`   Lot coverage max: ${phoenixZoning.lotCoverageMax ? (phoenixZoning.lotCoverageMax * 100) + '%' : 'N/A'}`);
        } else {
          console.log(`\n⚠️  WARNING: No Phoenix zoning data for ${project.parcel.zoning}`);
          console.log('   Available zones in database:');
          const allZones = await prisma.phoenixZoning.findMany({
            select: { zoningDistrict: true },
            orderBy: { zoningDistrict: 'asc' }
          });
          console.log('   ' + allZones.map(z => z.zoningDistrict).join(', '));
        }
      }
    } else {
      console.log('\n⚠️  No parcel data attached to project');
    }

    // Check/fix roadmap
    if (!project.roadmap) {
      console.log('\n📍 Creating roadmap...');
      const roadmap = await prisma.projectRoadmap.create({
        data: {
          projectId: project.id,
        }
      });

      console.log(`✅ Roadmap created: ${roadmap.id}`);

      console.log(`\n📍 Creating ${PROJECT_PHASES.length} phases...`);
      await prisma.roadmapPhase.createMany({
        data: PROJECT_PHASES.map((phase) => ({
          roadmapId: roadmap.id,
          name: phase.name,
          order: phase.order,
          status: phase.order === 1 ? 'in_progress' : 'waiting',
          estimatedDuration: phase.duration,
          description: phase.description,
          startDate: phase.order === 1 ? new Date() : null,
          services: [],
          dependencies: [],
        }))
      });

      console.log('✅ Created all phases');
    } else {
      console.log(`\n✅ Roadmap exists: ${project.roadmap.id}`);
      console.log(`   Phases: ${project.roadmap.phases.length}`);

      if (project.roadmap.phases.length === 0) {
        console.log('\n📍 Creating phases...');
        await prisma.roadmapPhase.createMany({
          data: PROJECT_PHASES.map((phase) => ({
            roadmapId: project.roadmap!.id,
            name: phase.name,
            order: phase.order,
            status: phase.order === 1 ? 'in_progress' : 'waiting',
            estimatedDuration: phase.duration,
            description: phase.description,
            startDate: phase.order === 1 ? new Date() : null,
            services: [],
            dependencies: [],
          }))
        });
        console.log('✅ Created all phases');
      } else {
        console.log('   Phases already exist - nothing to fix');
      }
    }

    console.log('\n✅ Fix complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Roadmap: ${project.roadmap ? 'EXISTS' : 'CREATED'}`);
    console.log(`   - Phases: ${project.roadmap?.phases.length || PROJECT_PHASES.length}`);
    console.log(`   - Parcel: ${project.parcel ? 'EXISTS' : 'MISSING'}`);
    console.log(`   - Boundary: ${project.parcel?.boundaryCoordinates ? 'EXISTS' : 'MISSING'}`);
    console.log(`   - Zoning: ${project.parcel?.zoning || 'MISSING'}`);

    console.log('\n🔄 Refresh the project page to see changes!');

  } catch (error) {
    console.error('❌ Error fixing project:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

fixHappyValleyProject()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
