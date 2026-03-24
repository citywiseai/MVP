import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/bids?taskId=xxx&vendorId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    console.log('🔐 Bids GET - Session:', session ? 'Authenticated' : 'Not authenticated');

    if (!session?.user) {
      console.error('❌ No session or user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');
    const vendorId = searchParams.get('vendorId');
    const status = searchParams.get('status');

    console.log('📥 Fetching bids with filters:', { taskId, vendorId, status });

    const bids = await prisma.bid.findMany({
      where: {
        ...(taskId && { taskId }),
        ...(vendorId && { vendorId }),
        ...(status && { status }),
      },
      include: {
        vendor: true,
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`✅ Found ${bids.length} bids`);
    return NextResponse.json({ bids }, { status: 200 });
  } catch (error) {
    console.error('❌ Error fetching bids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}

// POST /api/bids
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    console.log('🔐 Bids POST - Session:', session ? 'Authenticated' : 'Not authenticated');

    if (!session?.user) {
      console.error('❌ No session or user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📥 Creating bid:', {
      taskId: body.taskId,
      vendorId: body.vendorId,
      amount: body.amount,
    });

    const { taskId, vendorId, amount, estimatedCompletionDate, notes, attachmentUrl, attachmentName } = body;

    // Validate required fields
    if (!taskId || !vendorId || !amount) {
      console.error('❌ Missing required fields:', {
        taskId: !!taskId,
        vendorId: !!vendorId,
        amount: !!amount,
      });
      return NextResponse.json(
        { error: 'taskId, vendorId, and amount are required' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.error('❌ Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    console.log('✅ Creating bid in database...');
    const bid = await prisma.bid.create({
      data: {
        taskId,
        vendorId,
        amount: parsedAmount,
        estimatedCompletionDate: estimatedCompletionDate
          ? new Date(estimatedCompletionDate)
          : null,
        notes: notes || null,
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        status: 'received',
      },
      include: {
        vendor: true,
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    console.log('✅ Bid created successfully:', bid.id);
    return NextResponse.json({ bid }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating bid:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      {
        error: 'Failed to create bid',
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
