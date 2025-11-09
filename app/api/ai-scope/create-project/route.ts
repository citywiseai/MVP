import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { getRequirementsForProject, parseProjectDataToDetails } from '@/lib/requirements';

const prisma = new PrismaClient();

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

    const { projectData } = await req.json();

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
      try {
        const parcel = await prisma.parcel.create({
          data: {
            apn: projectData.parcelData.apn || '',
            address: projectData.parcelData.address,
            city: projectData.parcelData.city,
            state: projectData.parcelData.state || 'AZ',
            zipCode: projectData.parcelData.zip,
            zoning: projectData.parcelData.zoning,
            lotSizeSqFt: projectData.parcelData.lotSize,
            latitude: projectData.parcelData.latitude,
            longitude: projectData.parcelData.longitude,
            boundaryCoordinates: projectData.parcelData.boundaryCoordinates,
            existingSqFt: projectData.parcelData.buildingSize,
          }
        });
        parcelId = parcel.id;
        console.log('✅ Parcel created:', parcel.id);
      } catch (parcelError) {
        console.error('⚠️ Error creating parcel:', parcelError);
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
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
