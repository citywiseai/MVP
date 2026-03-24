import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';;
import { auth } from '@/lib/auth';
import { getRequirementsForProject, parseProjectDataToDetails } from '@/lib/requirements';
import { logProjectCreation } from '@/lib/audit-logger';



function parseScoutConversation(conversation: string) {
  const lines = conversation.split('\n');
  const summary: any = {
    projectTypes: [],
    additionSize: null,
    wallChanges: null,
    plumbing: [],
    electrical: null,
    aduSize: null,
    aduFeatures: []
  };

  lines.forEach(line => {
    if (line.includes('user:') || line.includes('User:')) {
      const content = line.toLowerCase();
      
      if (content.includes('addition')) summary.projectTypes.push('Addition');
      if (content.includes('remodel')) summary.projectTypes.push('Remodel');
      if (content.includes('adu')) summary.projectTypes.push('ADU');
      if (content.includes('new build')) summary.projectTypes.push('New Build');
      
      if (content.includes('under 500')) summary.additionSize = 'Under 500 sq ft';
      if (content.includes('500-1000') || content.includes('500 to 1000')) summary.additionSize = '500-1000 sq ft';
      if (content.includes('over 1000') || content.includes('1000+')) summary.additionSize = 'Over 1000 sq ft';
      
      if (content.includes('changing walls') || content.includes('moving') || content.includes('removing')) {
        summary.wallChanges = 'Yes, structural changes';
      }
      
      if (content.includes('bathroom')) summary.plumbing.push('Bathroom(s)');
      if (content.includes('kitchen')) summary.plumbing.push('Kitchen');
      
      if (content.includes('panel upgrade') || content.includes('upgrading panel')) {
        summary.electrical = 'Panel upgrade needed';
      }
      
      if (content.includes('adu') || content.includes('accessory dwelling')) {
        if (content.includes('under 500') || content.includes('< 500')) summary.aduSize = 'Under 500 sq ft';
        if (content.includes('500-1000') || content.includes('500 to 1000')) summary.aduSize = '500-1000 sq ft';
        if (content.includes('over 1000') || content.includes('1000+')) summary.aduSize = 'Over 1000 sq ft';
      }
      
      if (content.includes('adu') && content.includes('bathroom')) summary.aduFeatures.push('Bathroom');
      if (content.includes('adu') && content.includes('kitchen')) summary.aduFeatures.push('Kitchen');
      if (content.includes('adu') && content.includes('bedroom')) summary.aduFeatures.push('Bedroom(s)');
    }
  });

  return summary;
}

function createProjectSummary(summary: any) {
  const parts = [];
  
  if (summary.projectTypes.length > 0) {
    parts.push(`${summary.projectTypes.join(', ')}`);
  }
  
  if (summary.additionSize) {
    parts.push(`Addition: ${summary.additionSize}`);
  }
  
  if (summary.wallChanges) {
    parts.push(`Structural changes: Moving/removing walls`);
  }
  
  if (summary.plumbing.length > 0) {
    parts.push(`Plumbing: Adding ${summary.plumbing.join(' and ')}`);
  }
  
  if (summary.electrical) {
    parts.push(`Electrical panel upgrade`);
  }
  
  if (summary.aduSize) {
    parts.push(`ADU: ${summary.aduSize}`);
    if (summary.aduFeatures.length > 0) {
      parts.push(`Includes: ${summary.aduFeatures.join(', ')}`);
    }
  }
  
  return parts.join('. ');
}

function formatAddress(address: string): string {
  return address
    .split(',')
    .map((part, index) => {
      const trimmed = part.trim();
      if (index === 0) {
        return trimmed.split(' ').map(word => {
          if (['E', 'W', 'N', 'S', 'NE', 'NW', 'SE', 'SW'].includes(word.toUpperCase())) {
            return word.toUpperCase();
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
      } else if (index === 1) {
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      } else {
        const parts = trimmed.split(' ');
        if (parts.length >= 2) {
          return `${parts[0].toUpperCase()} ${parts.slice(1).join(' ')}`;
        }
        return trimmed;
      }
    })
    .join(', ');
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectData, analysisId } = await req.json();

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

    if (!orgId) {
      const userEmail = user.email;
      const orgName = userEmail.split('@')[0] + "'s Organization";

      const org = await prisma.org.create({
        data: {
          name: orgName,
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

    const fullAddress = projectData.fullAddress;
    const formattedAddress = fullAddress ? formatAddress(fullAddress) : null;

    const conversationSummary = parseScoutConversation(projectData.conversation || '');
    const cleanDescription = createProjectSummary(conversationSummary);

    // Create Parcel if parcelData exists
    let parcelId = null;
    if (projectData.parcelData) {
      console.log('📦 Creating parcel from Scout data');
      console.log('📍 Parcel data received:', {
        apn: projectData.parcelData.apn,
        address: projectData.parcelData.address,
        city: projectData.parcelData.city,
        zipCode: projectData.parcelData.zip,
        zoning: projectData.parcelData.zoning,
        lotSizeSqFt: projectData.parcelData.lotSizeSqFt,
        hasBoundaryCoordinates: !!projectData.parcelData.boundaryCoordinates,
        hasBoundaryRings: !!projectData.parcelData.boundaryRings,
        boundaryCoordinatesType: typeof projectData.parcelData.boundaryCoordinates,
        boundaryCoordinatesLength: projectData.parcelData.boundaryCoordinates?.length || 0,
        boundaryRingsLength: projectData.parcelData.boundaryRings?.length || 0
      });

      // Detailed boundary data logging
      if (projectData.parcelData.boundaryCoordinates) {
        console.log('📍 Boundary coordinates preview:',
          typeof projectData.parcelData.boundaryCoordinates === 'string'
            ? projectData.parcelData.boundaryCoordinates.substring(0, 100)
            : Array.isArray(projectData.parcelData.boundaryCoordinates)
              ? `Array with ${projectData.parcelData.boundaryCoordinates.length} points`
              : 'Unknown format'
        );
      } else {
        console.log('⚠️  NO BOUNDARY COORDINATES - setbacks will not work!');
      }

      try {
        const parcel = await prisma.parcel.create({
          data: {
            apn: projectData.parcelData.apn || '',
            address: projectData.parcelData.address,
            city: projectData.parcelData.city,
            state: projectData.parcelData.state || 'AZ',
            zipCode: projectData.parcelData.zip,
            zoning: projectData.parcelData.zoning,
            lotSizeSqFt: projectData.parcelData.lotSizeSqFt,
            latitude: projectData.parcelData.latitude,
            longitude: projectData.parcelData.longitude,
            boundaryCoordinates: projectData.parcelData.boundaryCoordinates,
            existingSqFt: projectData.parcelData.buildingSqFt,
          }
        });
        parcelId = parcel.id;
        console.log('✅ Parcel created:', parcel.id);
        console.log('✅ Boundary coordinates saved:', !!parcel.boundaryCoordinates, 'Length:',
          typeof parcel.boundaryCoordinates === 'string'
            ? JSON.parse(parcel.boundaryCoordinates).length
            : parcel.boundaryCoordinates?.length || 0
        );
      } catch (parcelError) {
        console.error('⚠️ Error creating parcel:', parcelError);
        console.error('Parcel error details:', parcelError instanceof Error ? parcelError.message : String(parcelError));
        // Continue without parcel if creation fails
      }
    }

    const project = await prisma.project.create({
      data: {
        name: `Project at ${formattedAddress || 'TBD'}`,
        fullAddress: formattedAddress,
        propertyType: 'Residential',
        projectType: projectData.projectType || 'ADDITION',
        description: cleanDescription,
        ownerId: user.id,
        orgId: orgId,
        parcelId: parcelId,
      }
    });

    console.log('✅ Project created:', project.id);

    // Link site analysis to project if analysisId provided
    if (analysisId) {
      try {
        await prisma.siteAnalysis.update({
          where: { id: analysisId },
          data: { projectId: project.id },
        });
        console.log('✅ Linked site analysis to project:', analysisId);
      } catch (linkError) {
        console.error('⚠️ Failed to link site analysis:', linkError);
        // Don't fail project creation if linking fails
      }
    }

    // Log project creation in audit trail
    await logProjectCreation(
      project.id,
      {
        source: analysisId ? 'site-analysis' : 'scout',
        initialScope: projectData.projectType ? [projectData.projectType] : [],
        ...(analysisId && { analysisId })
      },
      user.email
    );

    // Create roadmap and phases automatically
    console.log('📍 Creating roadmap and phases...');
    try {
      const roadmap = await prisma.projectRoadmap.create({
        data: {
          projectId: project.id,
        }
      });

      const PROJECT_PHASES = [
        { order: 1, name: "Discovery", duration: "2-4 weeks", description: "Initial site assessment and data collection" },
        { order: 2, name: "Design", duration: "3-6 weeks", description: "Architectural design and preliminary plans" },
        { order: 3, name: "Engineering", duration: "4-6 weeks", description: "Engineering calculations and compliance verification" },
        { order: 4, name: "Permit Submission", duration: "1-2 weeks", description: "Compile and submit permit application package" },
        { order: 5, name: "City Review", duration: "4-12 weeks", description: "City plan check and review process" },
        { order: 6, name: "Approval", duration: "1-2 weeks", description: "Permit approved and ready for construction" },
      ];

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

      console.log('✅ Created roadmap with 6 phases');
    } catch (roadmapError) {
      console.error('⚠️ Error creating roadmap:', roadmapError);
      // Don't fail project creation if roadmap fails
    }

    try {
      console.log('🔍 Parsing project details from conversation');
      const projectDetails = parseProjectDataToDetails(projectData);
      console.log('📋 Parsed project details:', projectDetails);
      
      const requirements = await getRequirementsForProject(projectDetails);
      console.log('📝 Generated requirements:', requirements.length, 'items');

      if (requirements.length > 0) {
        console.log('✅ Creating tasks from requirements...');
        await prisma.task.createMany({
          data: requirements.map((req) => ({
            title: req.name,
            description: req.description,
            status: 'pending',
            projectId: project.id,
            category: req.category || 'general', // Add category for cascade deletion
            isActive: true, // Mark as active
          }))
        });

        console.log('✅ Created', requirements.length, 'tasks successfully');
      } else {
        console.log('⚠️ No requirements generated');
      }
    } catch (error) {
      console.error('❌ Error generating requirements:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
    }

    return NextResponse.json({
      success: true,
      projectId: project.id,
      tasksCreated: true
    });
  } catch (error) {
    console.error('❌ ERROR creating project:', error);
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    if (error && typeof error === 'object') {
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    return NextResponse.json(
      { error: 'Failed to create project', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
