import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { projectId, setbacks } = await request.json();
    
    console.log('💾 Saving setbacks for project:', projectId, setbacks);
    
    // TODO: Save to your database
    // await prisma.project.update({
    //   where: { id: projectId },
    //   data: { 
    //     setbackFront: setbacks.front,
    //     setbackRear: setbacks.rear,
    //     setbackSideLeft: setbacks.sideLeft,
    //     setbackSideRight: setbacks.sideRight
    //   }
    // });
    
    return NextResponse.json({ success: true, setbacks });
  } catch (error) {
    console.error('Error saving setbacks:', error);
    return NextResponse.json({ error: 'Failed to save setbacks' }, { status: 500 });
  }
}
