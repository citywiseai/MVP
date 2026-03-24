import { NextRequest } from 'next/server';
import { searchRegridParcel } from '@/lib/regrid';
import { prisma } from '@/lib/prisma';
import { getRequirementsForProject } from '@/lib/requirements';
import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/lib/auth';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper to create SSE message
function createSSEMessage(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response(
        createSSEMessage('error', { error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    const { address } = await request.json();

    if (!address) {
      return new Response(
        createSSEMessage('error', { error: 'Address is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // STEP 1: Property Lookup via Regrid
          controller.enqueue(
            encoder.encode(
              createSSEMessage('progress', {
                step: 1,
                status: 'running',
                message: 'Searching property records...',
              })
            )
          );

          const parcelData = await searchRegridParcel(address);

          if (!parcelData) {
            controller.enqueue(
              encoder.encode(
                createSSEMessage('error', {
                  step: 1,
                  error: 'Property not found in Regrid database',
                })
              )
            );
            controller.close();
            return;
          }

          controller.enqueue(
            encoder.encode(
              createSSEMessage('progress', {
                step: 1,
                status: 'complete',
                message: 'Property data retrieved',
                data: {
                  address: parcelData.address,
                  apn: parcelData.apn,
                  lotSizeSqFt: parcelData.lotSizeSqFt,
                  zoning: parcelData.zoning,
                  yearBuilt: parcelData.yearBuilt,
                  buildingSqFt: parcelData.buildingSqFt,
                  latitude: parcelData.latitude,
                  longitude: parcelData.longitude,
                  boundaryCoordinates: parcelData.boundaryCoordinates,
                  landValue: parcelData.landValue,
                  improvementValue: parcelData.improvementValue,
                  totalValue: parcelData.totalValue,
                  lastSalePrice: parcelData.lastSalePrice,
                  lastSaleDate: parcelData.lastSaleDate,
                },
              })
            )
          );

          // STEP 2: Zoning Rules Lookup
          controller.enqueue(
            encoder.encode(
              createSSEMessage('progress', {
                step: 2,
                status: 'running',
                message: `Looking up ${parcelData.zoning} zoning regulations...`,
              })
            )
          );

          let zoningRules = null;
          if (parcelData.zoning) {
            try {
              zoningRules = await prisma.phoenixZoning.findFirst({
                where: {
                  zoningDistrict: {
                    equals: parcelData.zoning,
                    mode: 'insensitive',
                  },
                  jurisdiction: {
                    equals: 'phoenix',
                    mode: 'insensitive',
                  },
                },
              });
            } catch (error) {
              console.error('Error fetching zoning:', error);
            }
          }

          controller.enqueue(
            encoder.encode(
              createSSEMessage('progress', {
                step: 2,
                status: 'complete',
                message: zoningRules
                  ? 'Zoning rules retrieved'
                  : 'Zoning data not found in database',
                data: zoningRules
                  ? {
                      zoningDistrict: zoningRules.zoningDistrict,
                      districtName: zoningRules.districtName,
                      frontSetback: zoningRules.frontSetback,
                      sideSetback: zoningRules.sideSetback,
                      rearSetback: zoningRules.rearSetback,
                      lotCoverageMax: zoningRules.lotCoverageMax,
                      maxHeight: zoningRules.maxHeight,
                      maxStories: zoningRules.maxStories,
                      aduAllowed: zoningRules.aduAllowed,
                      maxADUs: zoningRules.maxADUs,
                      aduMaxSize: zoningRules.aduMaxSize,
                      aduMaxHeight: zoningRules.aduMaxHeight,
                      parkingPerUnit: zoningRules.parkingPerUnit,
                    }
                  : null,
              })
            )
          );

          // STEP 3: Assessor Data (existing building footprint)
          controller.enqueue(
            encoder.encode(
              createSSEMessage('progress', {
                step: 3,
                status: 'running',
                message: 'Analyzing existing building footprint...',
              })
            )
          );

          let assessorData = null;
          let existingFootprintSqFt = parcelData.buildingSqFt || 0;

          // Try to scrape assessor data for more accurate footprint
          try {
            // Create temporary parcel in database for scraper
            const tempParcel = await prisma.parcel.upsert({
              where: { apn: parcelData.apn },
              create: {
                apn: parcelData.apn,
                address: parcelData.address,
                city: parcelData.city,
                state: parcelData.state || 'AZ',
                zipCode: parcelData.zip,
                zoning: parcelData.zoning,
                lotSizeSqFt: parcelData.lotSizeSqFt,
                latitude: parcelData.latitude,
                longitude: parcelData.longitude,
                boundaryCoordinates: parcelData.boundaryCoordinates,
              },
              update: {},
            });

            // Call assessor scraper
            const assessorResponse = await fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/parcels/scrape-assessor`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  parcelId: tempParcel.id,
                  apn: parcelData.apn,
                }),
              }
            );

            if (assessorResponse.ok) {
              assessorData = await assessorResponse.json();
              existingFootprintSqFt = assessorData.totalFootprintSF || existingFootprintSqFt;
            }
          } catch (error) {
            console.error('Error scraping assessor:', error);
            // Fall back to Regrid data
          }

          controller.enqueue(
            encoder.encode(
              createSSEMessage('progress', {
                step: 3,
                status: 'complete',
                message: assessorData
                  ? 'Building footprint analyzed from assessor'
                  : 'Using building data from property records',
                data: {
                  existingFootprintSqFt,
                  buildingSections: assessorData?.buildingSections || [],
                  source: assessorData ? 'assessor' : 'regrid',
                },
              })
            )
          );

          // STEP 4: Buildable Area Calculation
          controller.enqueue(
            encoder.encode(
              createSSEMessage('progress', {
                step: 4,
                status: 'running',
                message: 'Calculating buildable area...',
              })
            )
          );

          const lotSizeSqFt = parcelData.lotSizeSqFt || 0;

          // Get max lot coverage from zoning or use defaults
          const getMaxLotCoverage = (zoningCode: string): number => {
            if (zoningRules?.lotCoverageMax) {
              return zoningRules.lotCoverageMax;
            }
            // Fallback defaults
            const coverageLimits: Record<string, number> = {
              'R1-6': 0.5,
              'R1-8': 0.45,
              'R1-10': 0.4,
              'R1-14': 0.4,
              'R-5': 0.6,
            };
            return coverageLimits[zoningCode] || 0.4;
          };

          const maxCoveragePercent = getMaxLotCoverage(parcelData.zoning || '');
          const totalBuildableAreaSqFt = lotSizeSqFt * maxCoveragePercent;
          const currentCoverageSqFt = existingFootprintSqFt;
          const remainingBuildableAreaSqFt = Math.max(
            0,
            totalBuildableAreaSqFt - currentCoverageSqFt
          );
          const coveragePercentUsed =
            lotSizeSqFt > 0 ? (currentCoverageSqFt / lotSizeSqFt) * 100 : 0;

          controller.enqueue(
            encoder.encode(
              createSSEMessage('progress', {
                step: 4,
                status: 'complete',
                message: 'Buildable area calculated',
                data: {
                  lotSizeSqFt,
                  maxCoveragePercent,
                  totalBuildableAreaSqFt,
                  existingFootprintSqFt,
                  currentCoverageSqFt,
                  remainingBuildableAreaSqFt,
                  coveragePercentUsed,
                },
              })
            )
          );

          // STEP 5: AI Feasibility Analysis
          controller.enqueue(
            encoder.encode(
              createSSEMessage('progress', {
                step: 5,
                status: 'running',
                message: 'AI analyzing site feasibility...',
              })
            )
          );

          // Prepare data for AI analysis
          const analysisPrompt = `You are a residential development feasibility expert analyzing a property in Phoenix, AZ.

**PROPERTY DATA:**
- Address: ${parcelData.address}
- Lot Size: ${lotSizeSqFt.toLocaleString()} sq ft (${parcelData.acres?.toFixed(2)} acres)
- Zoning: ${parcelData.zoning || 'Unknown'}${zoningRules ? ` - ${zoningRules.districtName}` : ''}
- Existing Building Footprint: ${existingFootprintSqFt.toLocaleString()} sq ft
- Year Built: ${parcelData.yearBuilt || 'Unknown'}
- Number of Stories: ${parcelData.stories || 'Unknown'}

**EXISTING BUILDING DETAILS:**
${assessorData?.buildingSections && assessorData.buildingSections.length > 0 ? `
Building Sections (from Assessor):
${assessorData.buildingSections.map((section: any) =>
  `  • ${section.name}: ${section.sqft} sq ft${section.includeInFootprint ? ' (ground level)' : ' (upper level)'}`
).join('\n')}
` : '- No detailed building sections available'}

**ZONING REGULATIONS:**
${zoningRules ? `
- Max Lot Coverage: ${(maxCoveragePercent * 100).toFixed(0)}%
- Max Buildable Area: ${totalBuildableAreaSqFt.toLocaleString()} sq ft
- Setbacks: Front ${zoningRules.frontSetback}ft, Side ${zoningRules.sideSetback}ft, Rear ${zoningRules.rearSetback}ft
- Max Height: ${zoningRules.maxHeight || 'Not specified'}${zoningRules.maxHeight ? ' ft' : ''}
- Max Stories: ${zoningRules.maxStories || 'Not specified'}
- ADU Allowed: ${zoningRules.aduAllowed ? 'Yes' : 'No'}
${zoningRules.aduAllowed ? `- Max ADU Size: ${zoningRules.aduMaxSize || 'Not specified'}${zoningRules.aduMaxSize ? ' sq ft' : ''}` : ''}
${zoningRules.aduAllowed ? `- Max ADUs: ${zoningRules.maxADUs || 'Not specified'}` : ''}
- Parking: ${zoningRules.parkingPerUnit || 'Not specified'}${zoningRules.parkingPerUnit ? ' spaces per unit' : ''}
` : '- No detailed zoning data available in database'}

**BUILDABLE AREA ANALYSIS:**
- Total Buildable Area: ${totalBuildableAreaSqFt.toLocaleString()} sq ft (${(maxCoveragePercent * 100).toFixed(0)}% of ${lotSizeSqFt.toLocaleString()} sq ft lot)
- Current Coverage: ${currentCoverageSqFt.toLocaleString()} sq ft (${coveragePercentUsed.toFixed(1)}% of lot)
- Remaining Buildable Area: ${remainingBuildableAreaSqFt.toLocaleString()} sq ft

**YOUR TASK:**
Analyze this property and provide a comprehensive feasibility assessment. Return your analysis as a JSON object with this EXACT structure:

{
  "feasibleProjects": [
    {
      "type": "ADU",
      "feasibility": "high" | "medium" | "low" | "not-feasible",
      "maxSize": <number in sq ft>,
      "reasoning": "Brief explanation",
      "estimatedCost": "range like $150k-$250k or null",
      "keyRequirements": ["requirement 1", "requirement 2"]
    },
    {
      "type": "Addition",
      "feasibility": "high" | "medium" | "low" | "not-feasible",
      "maxSize": <number>,
      "reasoning": "...",
      "estimatedCost": "...",
      "keyRequirements": [...]
    },
    {
      "type": "Second Story",
      "feasibility": "...",
      "maxSize": <number>,
      "reasoning": "...",
      "estimatedCost": "...",
      "keyRequirements": [...]
    },
    {
      "type": "Pool",
      "feasibility": "...",
      "maxSize": null,
      "reasoning": "...",
      "estimatedCost": "...",
      "keyRequirements": [...]
    }
  ],
  "setbackSummary": {
    "front": <number>,
    "side": <number>,
    "rear": <number>,
    "notes": "Any special considerations"
  },
  "potentialIssues": [
    "Issue 1 with specific details",
    "Issue 2 with specific details"
  ],
  "opportunities": [
    "Opportunity 1 with specific details",
    "Opportunity 2 with specific details"
  ],
  "recommendation": {
    "goNoGo": "GO" | "PROCEED WITH CAUTION" | "NO-GO",
    "reasoning": "Detailed explanation of recommendation",
    "bestOption": "What project type makes most sense and why",
    "nextSteps": ["Step 1", "Step 2", "Step 3"]
  },
  "estimatedTimeline": {
    "designPhase": "X-Y weeks",
    "permitting": "X-Y weeks",
    "construction": "X-Y months",
    "total": "X-Y months"
  }
}

IMPORTANT:
- Be specific with numbers and calculations
- Consider lot coverage limits carefully
- Flag any zoning violations or concerns
- Be realistic about costs and timelines
- If remaining buildable area is small, explain limitations
- Return ONLY valid JSON, no markdown, no explanation outside the JSON

**SECOND STORY ANALYSIS - CRITICAL:**
- If the building sections show sections named "2nd Floor", "Second Floor", "3rd Floor", "Upper Level", "Upstairs", or similar, the property ALREADY HAS multiple stories
- If the "Number of Stories" field shows 2 or more, the property is already multi-story
- For properties that ALREADY HAVE a second story:
  * Set feasibility to "existing" or include "Already exists" in the reasoning
  * Consider suggesting "second story EXPANSION" or "additional second story space" instead of "add a second story"
  * Explain that expansion/finishing/remodeling existing upper levels may be possible
- For single-story properties (Stories = 1 or "Unknown" AND no upper level sections in building data):
  * Suggest adding a second story as a new project
  * Consider structural requirements for adding a story to existing structure`;

          let aiAnalysis = null;
          try {
            const message = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4000,
              messages: [
                {
                  role: 'user',
                  content: analysisPrompt,
                },
              ],
            });

            const responseText =
              message.content[0].type === 'text' ? message.content[0].text : '';

            // Parse JSON from response
            let jsonText = responseText.trim();
            if (jsonText.startsWith('```json')) {
              jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            } else if (jsonText.startsWith('```')) {
              jsonText = jsonText.replace(/```\n?/g, '').trim();
            }
            if (!jsonText.startsWith('{')) {
              const jsonMatch = responseText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                jsonText = jsonMatch[0];
              }
            }

            aiAnalysis = JSON.parse(jsonText);
          } catch (error) {
            console.error('Error in AI analysis:', error);
            aiAnalysis = {
              error: 'AI analysis failed',
              feasibleProjects: [],
              recommendation: {
                goNoGo: 'PROCEED WITH CAUTION',
                reasoning: 'Unable to complete automated analysis. Manual review recommended.',
                bestOption: 'Contact a professional for site assessment',
                nextSteps: ['Consult with architect', 'Review zoning regulations', 'Get professional survey'],
              },
            };
          }

          controller.enqueue(
            encoder.encode(
              createSSEMessage('progress', {
                step: 5,
                status: 'complete',
                message: 'Feasibility analysis complete',
                data: aiAnalysis,
              })
            )
          );

          // STEP 6: Generate Final Report
          controller.enqueue(
            encoder.encode(
              createSSEMessage('progress', {
                step: 6,
                status: 'running',
                message: 'Compiling final report...',
              })
            )
          );

          const finalReport = {
            address: parcelData.address,
            apn: parcelData.apn,
            propertyData: {
              lotSizeSqFt,
              acres: parcelData.acres,
              zoning: parcelData.zoning,
              yearBuilt: parcelData.yearBuilt,
              latitude: parcelData.latitude,
              longitude: parcelData.longitude,
              boundaryCoordinates: parcelData.boundaryCoordinates,
              landValue: parcelData.landValue,
              improvementValue: parcelData.improvementValue,
              totalValue: parcelData.totalValue,
              lastSalePrice: parcelData.lastSalePrice,
              lastSaleDate: parcelData.lastSaleDate,
            },
            zoningRules: zoningRules ? {
              zoningDistrict: zoningRules.zoningDistrict,
              districtName: zoningRules.districtName,
              frontSetback: zoningRules.frontSetback,
              sideSetback: zoningRules.sideSetback,
              rearSetback: zoningRules.rearSetback,
              lotCoverageMax: zoningRules.lotCoverageMax,
              maxHeight: zoningRules.maxHeight,
              maxStories: zoningRules.maxStories,
              aduAllowed: zoningRules.aduAllowed,
              maxADUs: zoningRules.maxADUs,
              aduMaxSize: zoningRules.aduMaxSize,
              parkingPerUnit: zoningRules.parkingPerUnit,
            } : null,
            existingBuildings: {
              footprintSqFt: existingFootprintSqFt,
              buildingSections: assessorData?.buildingSections || [],
              source: assessorData ? 'assessor' : 'regrid',
            },
            buildableArea: {
              lotSizeSqFt,
              maxCoveragePercent,
              totalBuildableAreaSqFt,
              existingFootprintSqFt,
              currentCoverageSqFt,
              remainingBuildableAreaSqFt,
              coveragePercentUsed,
            },
            feasibilityAnalysis: aiAnalysis,
            generatedAt: new Date().toISOString(),
          };

          // Save analysis to database
          let siteAnalysisId = null;
          try {
            // Determine existing stories count
            const existingStories = parcelData.stories ||
              (assessorData?.buildingSections?.some((s: any) =>
                s.name?.toLowerCase().includes('2nd') ||
                s.name?.toLowerCase().includes('second') ||
                s.name?.toLowerCase().includes('upper')
              ) ? 2 : 1);

            console.log('💾 Attempting to save site analysis to database...');
            const siteAnalysis = await prisma.siteAnalysis.create({
              data: {
                userId: session.user.id,
                address: parcelData.address,
                apn: parcelData.apn,
                latitude: parcelData.latitude,
                longitude: parcelData.longitude,
                lotSizeSqFt,
                zoning: parcelData.zoning,
                zoningDescription: zoningRules?.districtName || null,
                existingBuildingSqFt: existingFootprintSqFt,
                existingStories,
                maxBuildableArea: totalBuildableAreaSqFt,
                currentCoverage: currentCoverageSqFt,
                remainingArea: remainingBuildableAreaSqFt,
                zoningRules: zoningRules || null,
                assessorData: assessorData || null,
                feasibilityReport: aiAnalysis,
                overallAssessment: aiAnalysis?.recommendation?.goNoGo || null,
                status: 'completed',
              },
            });
            siteAnalysisId = siteAnalysis.id;
            console.log('✅ Site analysis saved successfully with ID:', siteAnalysisId);
          } catch (dbError) {
            console.error('❌ Error saving site analysis:', dbError);
            console.error('Error details:', dbError instanceof Error ? dbError.message : String(dbError));
            // Continue even if save fails
          }

          console.log('📤 Sending complete event with siteAnalysisId:', siteAnalysisId);
          controller.enqueue(
            encoder.encode(
              createSSEMessage('complete', {
                step: 6,
                message: 'Site analysis complete',
                report: finalReport,
                siteAnalysisId,
              })
            )
          );

          controller.close();
        } catch (error) {
          console.error('Error in site analysis:', error);
          controller.enqueue(
            encoder.encode(
              createSSEMessage('error', {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
              })
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in site analysis API:', error);
    return new Response(
      createSSEMessage('error', {
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }
}
