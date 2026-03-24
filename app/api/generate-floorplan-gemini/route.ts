import { NextResponse } from 'next/server';
import { generateVisualization } from '@/lib/vision-engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      prompt,
      squareFootage,
      bedrooms,
      bathrooms,
      stories,
      style,
    } = body;

    const detailedPrompt = buildFloorPlanPrompt({
      prompt,
      squareFootage,
      bedrooms,
      bathrooms,
      stories,
      style,
    });

    console.log('🏠 Generating floor plan with Gemini:', detailedPrompt);

    // Use Gemini vision engine for floor plan generation
    const result = await generateVisualization({
      prompt: detailedPrompt,
      model: 'gemini-2.0-flash-exp',
    });

    if (!result.success) {
      console.error('❌ Gemini generation failed:', result.error);
      return NextResponse.json(
        { error: 'Failed to generate floor plan with Gemini', details: result.error },
        { status: 500 }
      );
    }

    console.log('✅ Gemini floor plan generated successfully');

    // Return base64 image data
    const imageUrl = `data:${result.mimeType};base64,${result.imageBase64}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt: detailedPrompt,
      model: 'gemini-2.0-flash-exp',
    });
  } catch (error: any) {
    console.error('❌ Error generating floor plan with Gemini:', error);

    return NextResponse.json(
      { error: 'Failed to generate floor plan', details: String(error) },
      { status: 500 }
    );
  }
}

function buildFloorPlanPrompt(params: {
  prompt?: string;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  style?: string;
}): string {
  // Base prompt with professional CAD style
  const basePrompt = "simple 2D architectural floor plan, clean black lines on white background, minimalist technical drawing, no shading, no furniture, no textures, simple rectangles for rooms, professional blueprint style, CAD drawing style";

  const specs: string[] = [];
  const sqft = params.squareFootage || 800;
  const beds = params.bedrooms || 2;
  const baths = params.bathrooms || 1;

  // Add square footage and room counts
  specs.push(`${sqft} square feet`);
  if (beds) specs.push(`${beds} bedrooms`);
  if (baths) specs.push(`${baths} bathrooms`);

  // Apply pattern-based layout recommendations based on size
  if (sqft < 500) {
    // 400-500 sqft: Studio/1BR - Open layout with efficient storage
    specs.push("open-concept layout with sleeping area");
    specs.push("galley kitchen 8-10 feet long");
    specs.push("full bathroom with washer/dryer");
    specs.push("walk-in closet");
    specs.push("dedicated entry area");
  } else if (sqft < 800) {
    // 500-800 sqft: 1-2BR - Hybrid with central hall
    specs.push("hybrid layout with open living/kitchen/dining and separated bedrooms");
    specs.push("central hallway circulation for privacy");
    specs.push("galley or L-shaped kitchen with pantry");
    specs.push("back-to-back bathroom plumbing");
    if (beds >= 2) {
      specs.push("split bedroom layout");
    }
    specs.push("walk-in closet in master bedroom");
    specs.push("dedicated laundry area");
  } else if (sqft < 1000) {
    // 800-1000 sqft: 2-3BR - More defined spaces
    specs.push("hybrid layout with open living/kitchen/dining and separated bedrooms");
    specs.push("central hallway separating public and private zones");
    specs.push("L-shaped kitchen with separate pantry");
    specs.push("back-to-back bathroom plumbing for efficiency");
    if (beds >= 2) {
      specs.push("split bedroom layout for maximum privacy");
    }
    specs.push("walk-in closets");
    specs.push("dedicated laundry room");
  } else {
    // 1000+ sqft: 2-4BR - Full features
    specs.push("hybrid layout with open living/kitchen/dining and separated bedrooms");
    specs.push("central hallway with efficient circulation");
    specs.push("L-shaped kitchen with island and separate pantry room");
    specs.push("back-to-back bathroom plumbing");
    if (beds >= 2) {
      specs.push("split bedroom layout with master separated");
    }
    specs.push("multiple walk-in closets");
    specs.push("dedicated laundry room with folding area");
    if (sqft >= 1200) {
      specs.push("kitchen island with integrated dishwasher");
    }
  }

  // Add common efficiency features
  specs.push("efficient use of space");
  specs.push("minimal wasted circulation area");

  // Add story specification
  if (params.stories && params.stories > 1) {
    specs.push(`${params.stories} story layout`);
  } else {
    specs.push("single story layout");
  }

  // Add user's custom requirements last
  if (params.prompt) {
    specs.push(params.prompt);
  }

  return `${basePrompt}, ${specs.join(", ")}`;
}
