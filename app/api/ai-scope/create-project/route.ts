import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getRequirementsForProject, parseProjectDataToDetails } from '@/lib/requirements';
import { searchRegridParcel } from '@/lib/regrid';

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

    // Create or fetch Parcel from Regrid
    let parcelId = null;
    if (formattedAddress) {
      console.log('📦 Fetching parcel data from Regrid for:', formattedAddress);
      try {
        // Fetch fresh data from Regrid to ensure we have complete boundary coordinates
        const parcelData = await searchRegridParcel(formattedAddress);
        
        if (parcelData && parcelData.apn) {
          // Build zoning rules
          const zoningRules = [];
          if (parcelData.subdivision || parcelData.platBook) {
            zoningRules.push({
              type: 'subdivision',
              name: parcelData.subdivision || 'Unknown Subdivision',
              platBook: parcelData.platBook,
              platPage: parcelData.platPage,
            });
          }
          if (parcelData.zoning) {
            zoningRules.push({
              type: 'zoning',
              code: parcelData.zoning,
              name: `Zoning: ${parcelData.zoning}`
            });
          }

          // Store complete Regrid data
          const propertyMetadata = parcelData.rawRegridData || {};

          // Upsert parcel (create or update if APN exists)
          const parcel = await prisma.parcel.upsert({
            where: { apn: parcelData.apn },
            create: {
              apn: parcelData.apn,
              address: parcelData.address,
              city: parcelData.city,
              state: parcelData.state,
              county: parcelData.county,
              zipCode: parcelData.zip,
              zoning: parcelData.zoning || '',
              lotSizeSqFt: Math.round(parcelData.lotSizeSqFt || 0),
              latitude: parcelData.latitude,
              longitude: parcelData.longitude,
              boundaryCoordinates: parcelData.boundaryRings,
              zoningRules: zoningRules,
              propertyMetadata: propertyMetadata,
            },
            update: {
              address: parcelData.address,
              city: parcelData.city,
              state: parcelData.state,
              county: parcelData.county,
              zipCode: parcelData.zip,
              zoning: parcelData.zoning || '',
              lotSizeSqFt: Math.round(parcelData.lotSizeSqFt || 0),
              latitude: parcelData.latitude,
              longitude: parcelData.longitude,
              boundaryCoordinates: parcelData.boundaryRings,
              zoningRules: zoningRules,
              propertyMetadata: propertyMetadata,
            },
          });
          parcelId = parcel.id;
          console.log('✅ Parcel created/updated:', parcel.id, 'APN:', parcelData.apn);
        } else {
          console.log('⚠️ No parcel data found from Regrid');
        }
      } catch (parcelError) {
        console.error('⚠️ Error fetching/creating parcel:', parcelError);
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