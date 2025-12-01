import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ASSESSOR_SCRAPER_URL = process.env.ASSESSOR_SCRAPER_URL;

export async function POST(request: Request) {
  try {
    const { parcelId, apn } = await request.json();

    if (!parcelId || !apn) {
      return NextResponse.json({ error: 'Missing parcelId or apn' }, { status: 400 });
    }

    const assessorUrl = `https://mcassessor.maricopa.gov/mcs/?q=${apn}&mod=pd`;

    if (!ASSESSOR_SCRAPER_URL) {
      await prisma.parcel.update({ where: { id: parcelId }, data: { assessorUrl } });
      return NextResponse.json({
        success: true,
        assessorUrl,
        message: 'Auto-import not configured. Click Assessor Report to view manually.',
        manualRequired: true,
        totalBuildingSF: null,
        buildingSections: [],
      });
    }

    console.log(`Calling assessor scraper for APN: ${apn}`);

    const workerResponse = await fetch(ASSESSOR_SCRAPER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apn }),
    });

    if (!workerResponse.ok) {
      await prisma.parcel.update({ where: { id: parcelId }, data: { assessorUrl } });
      return NextResponse.json({
        success: false,
        assessorUrl,
        message: 'Scraper unavailable. Click Assessor Report to view manually.',
        manualRequired: true,
      });
    }

    const data = await workerResponse.json();

    const updatedParcel = await prisma.parcel.update({
      where: { id: parcelId },
      data: {
        assessorUrl,
        totalBuildingSF: data.totalFootprintSF,
        buildingSections: data.buildingSections?.length > 0 ? data.buildingSections : null,
        buildingSketchesImage: data.screenshotBase64 || null,
        assessorDataFetchedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      assessorUrl,
      totalBuildingSF: data.totalFootprintSF,
      totalFootprintSF: data.totalFootprintSF,
      totalAllFloors: data.totalAllFloors,
      buildingSections: data.buildingSections || [],
      parcel: updatedParcel,
      message: data.message,
    });

  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
