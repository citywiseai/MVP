import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '@/lib/prisma';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  let browser;

  try {
    const { parcelId, apn } = await request.json();

    if (!parcelId || !apn) {
      return NextResponse.json(
        { error: 'Missing parcelId or apn' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    const assessorUrl = `https://mcassessor.maricopa.gov/mcs/?q=${apn}&mod=pd`;

    console.log('🤖 AI Agent: Launching browser...');

    // More robust browser launch
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      timeout: 60000 // 60 second timeout for launch
    });

    console.log('✅ Browser launched successfully');

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });

    console.log('📄 AI Agent: Navigating to', assessorUrl);

    // Navigate and wait for content
    await page.goto(assessorUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for body element to ensure page is loaded
    await page.waitForSelector('body', { timeout: 30000 });

    // Give JavaScript time to render dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🔍 Looking for SKETCHES tab to click...');

    // Try to click on the "SKETCHES" tab to load building sketches data
    try {
      // Look for link/button containing "SKETCHES" text
      const sketchesTabClicked = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a, button, div[role="tab"]'));
        const sketchesLink = links.find(link =>
          link.textContent?.trim().toUpperCase() === 'SKETCHES'
        );
        if (sketchesLink && sketchesLink instanceof HTMLElement) {
          sketchesLink.click();
          return true;
        }
        return false;
      });

      if (sketchesTabClicked) {
        console.log('✅ Clicked SKETCHES tab, waiting for content to load...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for tab content to load
      } else {
        console.log('⚠️  SKETCHES tab not found, continuing with default view');
      }
    } catch (error) {
      console.log('⚠️  Error clicking SKETCHES tab:', error);
    }

    // CAPTURE SCREENSHOT
    let screenshotBase64 = null;
    let buildingSketchesImage = null;

    console.log('📷 AI Agent: STARTING screenshot capture...');

    try {
      screenshotBase64 = await page.screenshot({
        encoding: 'base64',
        type: 'png',
        fullPage: true
      });

      buildingSketchesImage = `data:image/png;base64,${screenshotBase64}`;
      console.log('📷 ✅ Screenshot captured:', screenshotBase64.length, 'characters (base64)');

    } catch (imgError: any) {
      console.error('📷 ❌ Screenshot failed:', imgError.message);
    }

    if (!screenshotBase64) {
      await browser.close();
      return NextResponse.json(
        { error: 'Failed to capture screenshot' },
        { status: 500 }
      );
    }

    await browser.close();
    console.log('✅ Browser closed');

    // Use Claude Vision API to analyze the screenshot
    console.log('🧠 AI Agent: Analyzing screenshot with Claude Vision API...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshotBase64
              }
            },
            {
              type: 'text',
              text: `⚠️ RESPOND WITH ONLY A JSON OBJECT. NO PROSE, NO EXPLANATION, NO MARKDOWN, NO TEXT BEFORE OR AFTER THE JSON. ⚠️

Analyze this Maricopa County Assessor building sketch and extract GROUND FLOOR FOOTPRINT ONLY.

⚠️ CRITICAL RULES FOR LOT COVERAGE CALCULATION ⚠️

INCLUDE in footprint (ground-level structures that touch the ground):
✅ 1st Floor / Main Floor / Ground Floor
✅ Garage / Att Garage / Det Garage / Carport
✅ Addition (if at ground level)
✅ Covered Patio / Lanai / Porch
✅ Pool House / Cabana / Shed

EXCLUDE from footprint (upper levels that sit ON TOP of ground floor):
❌ 2nd Floor / Second Floor / Upper Level
❌ 3rd Floor / Third Floor
❌ Loft / Bonus Room / FROG (Finished Room Over Garage)
❌ ANY floor that is NOT at ground level
❌ ANY structure labeled with "Floor" that isn't 1st/Main/Ground

WHY: Lot coverage = building footprint ÷ lot area.
The footprint is the "shadow" the building casts on the ground.
A 2nd floor sitting directly above a 1st floor adds ZERO additional ground coverage.

REAL EXAMPLE:
Building sketch shows:
- 1st Floor: 1,198 sf
- 2nd Floor: 672 sf
- Att Garage: 560 sf
- Addition: 114.8 sf

Correct calculation:
- 1st Floor: 1,198 sf → INCLUDE ✅ (ground level)
- 2nd Floor: 672 sf → EXCLUDE ❌ (sits on top of 1st floor, no additional ground coverage)
- Att Garage: 560 sf → INCLUDE ✅ (ground level)
- Addition: 114.8 sf → INCLUDE ✅ (ground level addition)

FOOTPRINT = 1,198 + 560 + 114.8 = 1,872.8 sf (NOT 2,544.8!)

Return JSON in this EXACT format:
{
  "totalFootprintSF": <sum of ONLY ground-level structures>,
  "totalAllFloors": <sum of ALL sections for reference>,
  "buildingSections": [
    {
      "name": "1st Floor",
      "sqft": 1198,
      "dimensions": "51x51",
      "includeInFootprint": true,
      "type": "main_floor",
      "reason": "ground level"
    },
    {
      "name": "2nd Floor",
      "sqft": 672,
      "dimensions": "22x21",
      "includeInFootprint": false,
      "type": "upper_floor",
      "reason": "sits above 1st floor - adds no ground coverage"
    },
    {
      "name": "Att Garage",
      "sqft": 560,
      "includeInFootprint": true,
      "type": "garage",
      "reason": "ground level"
    },
    {
      "name": "Addition",
      "sqft": 114.8,
      "includeInFootprint": true,
      "type": "addition",
      "reason": "ground level addition"
    }
  ],
  "calculationSummary": "Footprint excludes 2nd Floor (672 sf) as it sits above 1st floor",
  "additionalInfo": {
    "yearBuilt": <number if visible>,
    "notes": "any relevant notes"
  }
}

IMPORTANT: Be precise - read exact square footage numbers from the sketch diagram.

If no building data found, return:
{
  "totalFootprintSF": null,
  "totalAllFloors": null,
  "buildingSections": [],
  "calculationSummary": "No building sketches found",
  "additionalInfo": { "notes": "No building sketches found" }
}`
            }
          ]
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log('🤖 AI Agent response (first 300 chars):', responseText.substring(0, 300));
    console.log('=== FULL CLAUDE API RESPONSE ===');
    console.log(responseText);
    console.log('=== END CLAUDE RESPONSE ===');

    // Parse JSON with fallback extraction
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }

    // If response starts with prose (not '{'), extract JSON using regex
    if (!jsonText.startsWith('{')) {
      console.log('⚠️  Response contains prose, extracting JSON with regex...');
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
        console.log('✅ Extracted JSON from prose response');
      } else {
        throw new Error('No JSON object found in Claude response');
      }
    }

    const extractedData = JSON.parse(jsonText);

    console.log('✅ AI Agent: Extracted', {
      totalFootprintSF: extractedData.totalFootprintSF,
      totalAllFloors: extractedData.totalAllFloors,
      sections: extractedData.buildingSections?.length || 0
    });

    // Update database
    console.log('💾 Saving to database:', {
      parcelId,
      totalBuildingSF: extractedData.totalFootprintSF, // Store FOOTPRINT as totalBuildingSF for lot coverage
      totalAllFloors: extractedData.totalAllFloors,
      sections: extractedData.buildingSections?.length,
      hasImage: !!buildingSketchesImage,
      imageLength: buildingSketchesImage?.length || 0
    });

    const updatedParcel = await prisma.parcel.update({
      where: { id: parcelId },
      data: {
        assessorUrl,
        totalBuildingSF: extractedData.totalFootprintSF, // Store FOOTPRINT for lot coverage calculation
        buildingSections: extractedData.buildingSections?.length > 0
          ? extractedData.buildingSections
          : null,
        buildingSketchesImage: buildingSketchesImage,
        assessorDataFetchedAt: new Date(),
      },
    });

    console.log('💾 Database updated successfully');
    console.log('💾 Returned parcel has image?', !!updatedParcel.buildingSketchesImage);

    return NextResponse.json({
      success: true,
      assessorUrl,
      totalBuildingSF: extractedData.totalFootprintSF, // Return FOOTPRINT (what we saved to DB)
      totalFootprintSF: extractedData.totalFootprintSF,
      totalAllFloors: extractedData.totalAllFloors,
      buildingSections: extractedData.buildingSections || [],
      additionalInfo: extractedData.additionalInfo,
      parcel: updatedParcel,
      message: extractedData.buildingSections?.length > 0
        ? `AI Agent found ${extractedData.buildingSections.length} building section(s) - Footprint: ${extractedData.totalFootprintSF} sq ft`
        : 'No building data found',
      // DEBUG INFO
      debug: {
        usingVisionAPI: true,
        screenshotSize: screenshotBase64.length,
        hasScreenshot: !!screenshotBase64
      }
    });

  } catch (error: any) {
    // Always close browser if it was opened
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }

    // Detailed error logging
    console.error('❌ AI Agent DETAILED ERROR:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Check for specific Puppeteer errors
    if (error.message?.includes('Failed to launch')) {
      return NextResponse.json(
        {
          error: 'Failed to launch browser. Puppeteer may not be installed correctly.',
          details: error.message,
          suggestion: 'Try: npm install puppeteer --force'
        },
        { status: 500 }
      );
    }

    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        {
          error: 'Browser timeout - assessor page took too long to load',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'AI Agent failed',
        errorType: error.name,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
