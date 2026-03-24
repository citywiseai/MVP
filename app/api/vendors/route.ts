import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/vendors - List all vendors (with optional trade filter and search)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const trade = searchParams.get('trade');
    const search = searchParams.get('search');
    const includeStats = searchParams.get('includeStats') === 'true';

    const vendors = await prisma.vendor.findMany({
      where: {
        createdById: session.user.id,
        ...(trade && { trade }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        _count: {
          select: {
            tasks: true,
            bids: true,
          },
        },
        ...(includeStats && {
          bids: {
            include: {
              task: {
                include: {
                  project: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        }),
      },
      orderBy: [
        { isPreferred: 'desc' }, // Preferred vendors first
        { name: 'asc' },
      ],
    });

    // Calculate stats if requested
    if (includeStats) {
      const vendorsWithStats = vendors.map(vendor => {
        const totalBids = vendor.bids?.length || 0;
        const acceptedBids = vendor.bids?.filter(b => b.status === 'accepted') || [];
        const totalAcceptedValue = acceptedBids.reduce((sum, b) => sum + b.amount, 0);
        const totalPaid = acceptedBids.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
        const winRate = totalBids > 0 ? (acceptedBids.length / totalBids) * 100 : 0;

        // Get unique projects
        const projects = vendor.bids
          ? [...new Set(vendor.bids.map(b => b.task?.project?.id).filter(Boolean))]
          : [];

        return {
          ...vendor,
          stats: {
            totalBids,
            acceptedBids: acceptedBids.length,
            totalAcceptedValue,
            totalPaid,
            totalOutstanding: totalAcceptedValue - totalPaid,
            winRate: Math.round(winRate),
            projectCount: projects.length,
          },
        };
      });

      return NextResponse.json(vendorsWithStats, { status: 200 });
    }

    return NextResponse.json({ vendors }, { status: 200 });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST /api/vendors - Create new vendor
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    console.log('🔐 Session:', session ? 'Authenticated' : 'Not authenticated');

    if (!session?.user) {
      console.error('❌ No session or user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📥 Received vendor data:', {
      name: body.name,
      trade: body.trade,
      company: body.company,
      email: body.email,
      phone: body.phone,
      userId: session.user.id
    });

    const {
      name,
      company,
      email,
      phone,
      trade,
      licenseNumber,
      insuranceExpiry,
      rating,
      notes,
      isPreferred,
    } = body;

    // Validate required fields
    if (!name || !trade) {
      console.error('❌ Missing required fields:', { name: !!name, trade: !!trade });
      return NextResponse.json(
        { error: 'Name and trade are required' },
        { status: 400 }
      );
    }

    console.log('✅ Creating vendor in database...');
    const vendor = await prisma.vendor.create({
      data: {
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
        trade,
        licenseNumber: licenseNumber || null,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        rating: rating ? parseFloat(rating) : null,
        notes: notes || null,
        isPreferred: isPreferred || false,
        createdById: session.user.id,
      },
    });

    console.log('✅ Vendor created successfully:', vendor.id);
    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating vendor:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      {
        error: 'Failed to create vendor',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
