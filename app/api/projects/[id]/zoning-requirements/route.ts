import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 ZONING REQUIREMENTS API CALLED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const { id: projectId } = await params;
    console.log('📍 Project ID:', projectId);

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get project with parcel data
    console.log('🔍 Fetching project from database...');
    console.log('   Prisma client available:', !!prisma);
    console.log('   Prisma.project available:', !!prisma.project);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        parcel: true,
        zoningDistrict: {
          include: {
            municipality: true,
            zoningRules: true,
          },
        },
      },
    });

    console.log('✅ Project fetched:', project ? 'Found' : 'Not found');
    if (project) {
      console.log('   Has parcel:', !!project.parcel);
      console.log('   Parcel zoning:', project.parcel?.zoning);
      console.log('   Parcel city:', project.parcel?.city);
      console.log('   Has zoningDistrict:', !!project.zoningDistrict);
    }

    if (!project) {
      console.log('❌ Project not found, returning 404');
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // If project already has a zoning district linked, return it
    if (project.zoningDistrict) {
      const applicableRules = project.projectType
        ? project.zoningDistrict.zoningRules.filter(
            (rule) =>
              rule.projectTypes.length === 0 ||
              rule.projectTypes.includes(project.projectType!)
          )
        : project.zoningDistrict.zoningRules;

      return NextResponse.json({
        hasZoning: true,
        municipality: {
          name: project.zoningDistrict.municipality.name,
          state: project.zoningDistrict.municipality.state,
        },
        zoningDistrict: {
          code: project.zoningDistrict.code,
          name: project.zoningDistrict.name,
          description: project.zoningDistrict.description,
        },
        rules: applicableRules.map((rule) => ({
          category: rule.category,
          name: rule.name,
          valueNumber: rule.valueNumber,
          valueText: rule.valueText,
          unit: rule.unit,
          description: rule.description,
        })),
      });
    }

    // If no parcel or zoning code, return null
    if (!project.parcel?.zoning) {
      return NextResponse.json({
        hasZoning: false,
        message: 'No zoning information available for this property',
      });
    }

    const zoningCode = project.parcel.zoning;
    console.log('🏘️  Zoning code from parcel:', zoningCode);

    // Try to find municipality based on parcel city, fallback to Phoenix
    let municipality = null;

    console.log('🔍 Looking up municipality...');
    console.log('   Prisma.municipality available:', !!prisma.municipality);

    if (project.parcel.city) {
      console.log('   Searching for municipality by city:', project.parcel.city);
      try {
        municipality = await prisma.municipality.findFirst({
          where: {
            name: {
              contains: project.parcel.city,
              mode: 'insensitive',
            },
          },
        });
        console.log('   Result:', municipality ? `Found: ${municipality.name}` : 'Not found');
      } catch (municipalityError) {
        console.error('❌ Error querying municipality by city:', municipalityError);
        console.error('   Error type:', municipalityError instanceof Error ? municipalityError.constructor.name : typeof municipalityError);
        console.error('   Error message:', municipalityError instanceof Error ? municipalityError.message : String(municipalityError));
        throw municipalityError;
      }
    }

    // Fallback to Phoenix if city not found
    if (!municipality) {
      console.log('   Falling back to Phoenix...');
      try {
        municipality = await prisma.municipality.findFirst({
          where: { name: 'Phoenix' },
        });
        console.log('   Phoenix lookup result:', municipality ? `Found: ${municipality.name}` : 'Not found');
      } catch (phoenixError) {
        console.error('❌ Error querying Phoenix municipality:', phoenixError);
        console.error('   Error type:', phoenixError instanceof Error ? phoenixError.constructor.name : typeof phoenixError);
        console.error('   Error message:', phoenixError instanceof Error ? phoenixError.message : String(phoenixError));
        throw phoenixError;
      }
    }

    if (!municipality) {
      return NextResponse.json({
        hasZoning: false,
        message: 'Municipality not found in database',
      });
    }

    // Find zoning district
    const zoningDistrict = await prisma.zoningDistrict.findFirst({
      where: {
        municipalityId: municipality.id,
        code: zoningCode,
      },
      include: {
        zoningRules: true,
      },
    });

    if (!zoningDistrict) {
      return NextResponse.json({
        hasZoning: true,
        zoningCode,
        municipality: municipality.name,
        message: `Zoning code ${zoningCode} found but not in our database yet`,
      });
    }

    // Filter rules by project type if specified
    let applicableRules = zoningDistrict.zoningRules;
    if (project.projectType) {
      applicableRules = zoningDistrict.zoningRules.filter(
        (rule) =>
          rule.projectTypes.length === 0 ||
          rule.projectTypes.includes(project.projectType!)
      );
    }

    // Link project to zoning district
    await prisma.project.update({
      where: { id: projectId },
      data: { zoningDistrictId: zoningDistrict.id },
    });

    console.log(`✅ Linked project ${projectId} to zoning district ${zoningDistrict.code}`);

    return NextResponse.json({
      hasZoning: true,
      municipality: {
        name: municipality.name,
        state: municipality.state,
      },
      zoningDistrict: {
        code: zoningDistrict.code,
        name: zoningDistrict.name,
        description: zoningDistrict.description,
      },
      rules: applicableRules.map((rule) => ({
        category: rule.category,
        name: rule.name,
        valueNumber: rule.valueNumber,
        valueText: rule.valueText,
        unit: rule.unit,
        description: rule.description,
      })),
    });
  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR IN ZONING REQUIREMENTS API');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Full error details:', error);
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error code:', (error as any).code);
      console.error('Prisma error meta:', (error as any).meta);
    }

    // Log the state of prisma
    console.error('Prisma client state:');
    console.error('  - prisma exists:', !!prisma);
    console.error('  - prisma.municipality exists:', !!(prisma as any).municipality);
    console.error('  - prisma.zoningDistrict exists:', !!(prisma as any).zoningDistrict);
    console.error('  - prisma.project exists:', !!(prisma as any).project);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json(
      {
        error: 'Failed to fetch zoning requirements',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
