import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateVisualization, generatePreview, generateStudioQuality } from '@/lib/vision-engine';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { prompt, baseImage, referenceImages, quality = 'preview' } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('🎨 Generating AI visualization:', {
      quality,
      hasBaseImage: !!baseImage,
      referenceCount: referenceImages?.length || 0,
      promptLength: prompt.length,
    });

    // Choose the appropriate generation function based on quality
    const result = quality === 'studio'
      ? await generateStudioQuality({ prompt, baseImage, referenceImages })
      : await generatePreview({ prompt, baseImage, referenceImages });

    if (!result.success) {
      console.error('❌ Visualization generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate visualization' },
        { status: 500 }
      );
    }

    console.log('✅ Visualization generated successfully');

    return NextResponse.json({
      success: true,
      imageData: `data:${result.mimeType};base64,${result.imageBase64}`,
      model: result.model,
      promptUsed: result.promptUsed,
    });
  } catch (error) {
    console.error('❌ Visualization API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
