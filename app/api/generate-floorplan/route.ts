import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

    console.log('🏠 Generating floor plan:', detailedPrompt);

    // Use predictions.create instead of replicate.run for better control
    const prediction = await replicate.predictions.create({
      version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // SDXL
      input: {
        prompt: detailedPrompt,
        negative_prompt: "3d, realistic, photograph, furniture, decoration, colors, shading, gradient, perspective, isometric, people, trees, landscape, detailed, complex, cluttered, artistic, painterly, watercolor, overly complex layout, excessive hallways, wasted circulation space, disconnected rooms, poor flow, bedrooms off living room, bathroom without hallway buffer, kitchen far from dining, no storage, no closets, impractical room sizes, bedrooms under 80 sqft, hallways over 4 feet wide",
        width: 1024,
        height: 1024,
        num_outputs: 1,
        scheduler: "K_EULER",
        num_inference_steps: 50,
        guidance_scale: 7.5,
      }
    });

    console.log('🎨 Initial prediction:', prediction);

    // Wait for the prediction to complete
    const finalPrediction = await replicate.wait(prediction);
    console.log('🎨 Final prediction:', finalPrediction);
    console.log('🎨 Final prediction output:', finalPrediction.output);

    const output = finalPrediction.output;

    console.log('🎨 Raw output:', output);
    console.log('🎨 Output type:', typeof output);
    console.log('🎨 Output constructor:', output?.constructor?.name);

    // Handle different output formats from Replicate
    let imageUrl: string | null = null;

    if (typeof output === 'string') {
      imageUrl = output;
    } else if (Array.isArray(output)) {
      // Array of URLs or FileOutput objects
      const firstItem = output[0];
      console.log('📦 First item type:', typeof firstItem);
      console.log('📦 First item constructor:', firstItem?.constructor?.name);
      console.log('📦 First item keys:', firstItem ? Object.keys(firstItem) : 'null');
      console.log('📦 First item:', firstItem);

      if (typeof firstItem === 'string') {
        imageUrl = firstItem;
      } else if (firstItem && typeof firstItem === 'object') {
        // FileOutput object or ReadableStream - try different approaches
        const obj = firstItem as any;

        // Try common properties
        imageUrl = obj.url || obj.uri || obj.href || null;

        // If it's a ReadableStream or has a toString method
        if (!imageUrl) {
          // Check if it has a readable data URL
          if (obj.constructor?.name === 'ReadableStream' || obj.constructor?.name === 'FileOutput') {
            console.log('🔄 Detected ReadableStream/FileOutput, trying toString()');
            try {
              const str = String(obj);
              console.log('🔄 toString() result:', str);
              if (str && str.startsWith('http')) {
                imageUrl = str;
              } else {
                // Try reading the stream as text
                console.log('🔄 Attempting to read stream...');
                // For FileOutput objects, they often have a public URL accessible via their internal properties
                if (obj._url || obj.url || obj.publicUrl) {
                  imageUrl = obj._url || obj.url || obj.publicUrl;
                }
              }
            } catch (e) {
              console.error('Error converting FileOutput:', e);
            }
          }
        }

        // Last resort - stringify and look for URL patterns
        if (!imageUrl) {
          try {
            const jsonStr = JSON.stringify(obj);
            console.log('📄 Object JSON:', jsonStr);
            const urlMatch = jsonStr.match(/https?:\/\/[^\s"]+/);
            if (urlMatch) {
              imageUrl = urlMatch[0];
            }
          } catch (e) {
            // Ignore stringify errors
          }
        }
      }
    } else if (output && typeof output === 'object') {
      // Single FileOutput object
      const obj = output as any;
      imageUrl = obj.url || obj.uri || obj.href || null;

      // If it has a toString that returns a URL
      if (!imageUrl && obj.toString && obj.toString() !== '[object Object]') {
        const str = obj.toString();
        if (str.startsWith('http')) {
          imageUrl = str;
        }
      }
    }

    // Log what we extracted
    console.log('🖼️ Extracted imageUrl:', imageUrl);

    if (!imageUrl) {
      // Try converting the whole output to see what it contains
      console.log('❌ Could not extract URL. Output JSON:', JSON.stringify(output, null, 2));
      return NextResponse.json(
        { error: 'Failed to extract image URL from Replicate response', rawOutput: String(output) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt: detailedPrompt,
    });
  } catch (error: any) {
    console.error('❌ Error generating floor plan:', error);

    if (error?.response?.status === 402) {
      return NextResponse.json(
        { error: 'Insufficient Replicate credits', needsCredits: true },
        { status: 402 }
      );
    }

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
