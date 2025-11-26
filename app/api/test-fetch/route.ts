import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const testUrl = 'https://mcassessor.maricopa.gov/mcs/?q=16630141&mod=pd';

    console.log('Testing fetch to:', testUrl);

    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const html = await response.text();

    return NextResponse.json({
      success: true,
      status: response.status,
      htmlLength: html.length,
      containsBuildingSketches: html.includes('BUILDING SKETCHES')
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
