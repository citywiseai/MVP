#!/usr/bin/env node

import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface FloorPlanMetadata {
  id: string;
  source: string;
  sourceUrl: string;
  imageUrl: string;
  localImagePath?: string;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  stories?: number;
  style?: string;
  description?: string;
  scrapedAt: string;
}

interface PatternAnalysis {
  planId: string;
  metadata: FloorPlanMetadata;
  roomCount: number;
  roomTypes: string[];
  layoutType: string; // "open-concept", "traditional-separated", "hybrid"
  circuationPattern: string; // "linear", "circular", "central-hall", "split"
  entryType: string;
  kitchenLocation: string;
  bedroomLayout: string;
  bathroomPlacement: string;
  storageFeatures: string[];
  efficiencyNotes: string[];
  uniqueFeatures: string[];
  dimensionNotes: string;
}

/**
 * Analyze a single floor plan image using Claude Vision
 */
async function analyzeFloorPlanImage(
  imagePath: string,
  metadata: FloorPlanMetadata
): Promise<PatternAnalysis | null> {
  try {
    // Read image file
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Determine media type
    const ext = path.extname(imagePath).toLowerCase();
    const mediaType = ext === '.png' ? 'image/png' : 'image/jpeg';

    console.log(`\n🔍 Analyzing ${metadata.id}...`);
    console.log(`   ${metadata.squareFootage || '?'} sqft, ${metadata.bedrooms || '?'}bd/${metadata.bathrooms || '?'}ba`);

    // Create detailed prompt for Claude Vision
    const prompt = `Analyze this floor plan image in detail. This is a ${metadata.squareFootage || 'unknown'} sqft ${metadata.style || ''} with ${metadata.bedrooms || 'unknown'} bedrooms and ${metadata.bathrooms || 'unknown'} bathrooms.

Please provide a detailed analysis in the following JSON format:

{
  "roomCount": <total number of distinct rooms/spaces>,
  "roomTypes": [<array of room types found, e.g., "kitchen", "bedroom", "bathroom", "living room", "dining room", "laundry", "closet", "pantry", "garage", etc.>],
  "layoutType": "<one of: open-concept, traditional-separated, hybrid>",
  "circulationPattern": "<one of: linear, circular, central-hall, split, open-flow>",
  "entryType": "<description of entry/foyer arrangement>",
  "kitchenLocation": "<location and adjacencies>",
  "bedroomLayout": "<how bedrooms are arranged, e.g., 'split bedroom layout', 'all bedrooms clustered', 'master separated'>",
  "bathroomPlacement": "<bathroom locations and types, e.g., 'ensuite in master, shared hall bath'>",
  "storageFeatures": [<array of storage elements like "walk-in closet", "pantry", "linen closet", "coat closet">],
  "efficiencyNotes": [<array of space-efficient design choices, e.g., "galley kitchen saves space", "back-to-back bathrooms share plumbing", "open living reduces circulation">],
  "uniqueFeatures": [<array of notable or unusual design elements>],
  "dimensionNotes": "<observations about room sizes and proportions>"
}

Focus on:
1. Room organization and flow
2. Efficient use of space
3. Common small-home design patterns
4. Practical layout decisions
5. How rooms relate to each other

Respond ONLY with valid JSON, no additional text.`;

    // Call Claude Vision API
    const response = await anthropic.messages.create({
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
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract JSON from response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.log('   ❌ No text response from Claude');
      return null;
    }

    // Parse JSON response
    let analysisData;
    try {
      // Try to extract JSON from markdown code block if present
      const jsonMatch = textContent.text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : textContent.text;
      analysisData = JSON.parse(jsonStr);
    } catch (e) {
      console.log('   ❌ Failed to parse JSON response');
      console.log('   Response:', textContent.text.substring(0, 200));
      return null;
    }

    const analysis: PatternAnalysis = {
      planId: metadata.id,
      metadata,
      ...analysisData,
    };

    console.log(`   ✅ Analysis complete`);
    console.log(`      Rooms: ${analysis.roomCount}, Layout: ${analysis.layoutType}`);
    console.log(`      Circulation: ${analysis.circulationPattern}`);

    return analysis;
  } catch (error: any) {
    console.error(`   ❌ Error analyzing ${metadata.id}:`, error.message);
    return null;
  }
}

/**
 * Main analysis function
 */
async function main() {
  const args = process.argv.slice(2);
  const source = args[0] || 'betterplace';
  const maxPlans = args[1] ? parseInt(args[1]) : 10;

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          🔬 FLOOR PLAN PATTERN ANALYZER                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Source:       ${source}`);
  console.log(`Max Plans:    ${maxPlans}`);
  console.log(`Started:      ${new Date().toLocaleString()}`);
  console.log('');

  const metadataDir = path.join(process.cwd(), 'data/floor-plans/metadata', source);
  const imagesDir = path.join(process.cwd(), 'data/floor-plans/images', source);
  const outputDir = path.join(process.cwd(), 'data/floor-plans/analysis', source);

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Read all metadata files
  const metadataFiles = await fs.readdir(metadataDir);
  const jsonFiles = metadataFiles.filter((f) => f.endsWith('.json'));

  console.log(`📄 Found ${jsonFiles.length} floor plans in ${source}\n`);

  const analyses: PatternAnalysis[] = [];
  let analyzed = 0;

  for (const jsonFile of jsonFiles.slice(0, maxPlans)) {
    const metadataPath = path.join(metadataDir, jsonFile);
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata: FloorPlanMetadata = JSON.parse(metadataContent);

    // Find image file
    const imagePath = path.join(imagesDir, metadata.localImagePath || `${metadata.id}.jpg`);

    // Check if image exists
    try {
      await fs.access(imagePath);
    } catch (e) {
      console.log(`⚠️  Image not found for ${metadata.id}, skipping`);
      continue;
    }

    // Analyze the floor plan
    const analysis = await analyzeFloorPlanImage(imagePath, metadata);

    if (analysis) {
      analyses.push(analysis);

      // Save individual analysis
      const analysisPath = path.join(outputDir, `${metadata.id}-analysis.json`);
      await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2));

      analyzed++;
    }

    // Rate limiting - be respectful to Claude API
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 PATTERN ANALYSIS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total analyzed:    ${analyzed} plans`);
  console.log('');

  // Aggregate patterns
  const layoutTypes: Record<string, number> = {};
  const circulationPatterns: Record<string, number> = {};
  const commonFeatures: Record<string, number> = {};

  for (const analysis of analyses) {
    // Layout types
    layoutTypes[analysis.layoutType] = (layoutTypes[analysis.layoutType] || 0) + 1;

    // Circulation patterns
    circulationPatterns[analysis.circulationPattern] =
      (circulationPatterns[analysis.circulationPattern] || 0) + 1;

    // Common features
    for (const feature of analysis.uniqueFeatures || []) {
      commonFeatures[feature] = (commonFeatures[feature] || 0) + 1;
    }
  }

  console.log('Layout Types:');
  Object.entries(layoutTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count} (${Math.round((count / analyzed) * 100)}%)`);
    });

  console.log('\nCirculation Patterns:');
  Object.entries(circulationPatterns)
    .sort((a, b) => b[1] - a[1])
    .forEach(([pattern, count]) => {
      console.log(`  ${pattern}: ${count} (${Math.round((count / analyzed) * 100)}%)`);
    });

  console.log('\nCommon Features (top 10):');
  Object.entries(commonFeatures)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([feature, count]) => {
      console.log(`  ${feature}: ${count}`);
    });

  // Save summary report
  const summary = {
    source,
    analyzedCount: analyzed,
    totalPlans: jsonFiles.length,
    analyzedAt: new Date().toISOString(),
    layoutTypes,
    circulationPatterns,
    commonFeatures,
    analyses,
  };

  const summaryPath = path.join(outputDir, 'summary-report.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

  console.log('');
  console.log('='.repeat(60));
  console.log(`📁 Analysis saved to: ${outputDir}`);
  console.log(`📄 Summary report: ${summaryPath}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
