import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { analyzeProjectScope } from '@/lib/ai';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectData } = await req.json();

    // Get user and org
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        memberships: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let orgId = user.memberships[0]?.orgId;

    // Create org if needed
    if (!orgId) {
      const userEmail = user.email;
      const orgName = userEmail.split('@')[0] + "'s Organization";
      const orgSlug = userEmail.replace('@', '-').replace('.', '-');

      const org = await prisma.org.create({
        data: {
          name: orgName,
          slug: orgSlug,
        }
      });

      await prisma.membership.create({
        data: {
          userId: user.id,
          orgId: org.id,
          role: 'OWNER',
        }
      });

      orgId = org.id;
    }

    // Fetch parcel data if address is in Phoenix/Maricopa County
    let parcelId: string | null = null;
    const fullAddress = projectData.fullAddress;

    if (fullAddress && (fullAddress.toLowerCase().includes('phoenix') || fullAddress.toLowerCase().includes('az'))) {
      try {
        const { getMaricopaParcelByAddress } = await import('@/lib/regrid');
        const streetAddress = fullAddress.split(',')[0].trim();
        const parcelData = await getMaricopaParcelByAddress(streetAddress);

        if (parcelData) {
          const parcel = await prisma.parcel.upsert({
            where: { apn: parcelData.apn },
            create: {
              apn: parcelData.apn,
              address: `${parcelData.address}, ${parcelData.city}, AZ ${parcelData.zip}`,
              jurisdiction: parcelData.city,
              zoningCode: '',
              lotSizeSqFt: Math.round(parcelData.lotSizeSqFt),
              latitude: parcelData.latitude,
              longitude: parcelData.longitude,
              boundaryCoordinates: parcelData.boundaryRings,
              zoningRules: []
            },
            update: {
              address: `${parcelData.address}, ${parcelData.city}, AZ ${parcelData.zip}`,
              jurisdiction: parcelData.city,
              lotSizeSqFt: Math.round(parcelData.lotSizeSqFt),
              latitude: parcelData.latitude,
              longitude: parcelData.longitude,
              boundaryCoordinates: parcelData.boundaryRings
            }
          });

          parcelId = parcel.id;
        }
      } catch (error) {
        console.error('Error fetching parcel data:', error);
      }
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name: `${projectData.projectType || 'Project'} at ${projectData.fullAddress || 'TBD'}`,
        fullAddress: projectData.fullAddress,
        propertyType: 'Residential',
        projectType: projectData.projectType,
        buildingFootprintSqFt: projectData.squareFootage,
        totalSfModified: projectData.squareFootage,
        description: projectData.description,
        scopeOfWork: projectData.description,
        orgId: orgId,
        userId: user.id,
        parcelId: parcelId,
      }
    });

    // Generate engineering requirements
    try {
      const requirements = await analyzeProjectScope({
        projectType: projectData.projectType || 'residential',
        squareFootage: projectData.squareFootage || 1000,
        scopeOfWork: projectData.description || `${projectData.projectType} project`,
        propertyType: 'Residential',
        hillsideGrade: false,
        onSeptic: false
      });

      if (requirements.length > 0) {
        await prisma.engineeringRequirement.createMany({
          data: requirements.map((req: any, index: number) => ({
            id: `eng_req_${project.id}_${index}`,
            projectId: project.id,
            requirement: req.notes || req.discipline || 'Engineering requirement',
            discipline: req.discipline,
            required: req.required,
            notes: req.notes
          }))
        });
      }
    } catch (error) {
      console.error('Error generating engineering requirements:', error);
    }

    return NextResponse.json({ 
      success: true, 
      projectId: project.id 
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
