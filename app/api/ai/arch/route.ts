import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface ShapeElement {
  type: 'room' | 'door' | 'window' | 'closet' | 'fixture';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

interface ShapeSpec {
  name: string;
  width: number;
  length: number;
  elements: ShapeElement[];
}

/**
 * Generate SVG from shape specification
 */
function generateSvgFromSpec(spec: ShapeSpec): string {
  const scale = 10; // 10 pixels per foot (matches template pattern)
  const svgWidth = spec.width * scale;
  const svgHeight = spec.length * scale;

  let elements = '';

  // Sort elements by type so rooms are drawn first, then fixtures
  const sortedElements = [...spec.elements].sort((a, b) => {
    const order = { room: 0, closet: 1, fixture: 2, door: 3, window: 4 };
    return order[a.type] - order[b.type];
  });

  for (const element of sortedElements) {
    const x = element.x * scale;
    const y = element.y * scale;
    const width = element.width * scale;
    const height = element.height * scale;

    switch (element.type) {
      case 'room':
        // Room outline with label
        elements += `
          <rect x="${x}" y="${y}" width="${width}" height="${height}"
                fill="none" stroke="#333" stroke-width="2"/>
          <text x="${x + width/2}" y="${y + height/2}"
                text-anchor="middle" dominant-baseline="middle"
                font-size="12" font-family="Arial" fill="#333">${element.label || element.name}</text>
        `;
        break;

      case 'closet':
        // Closet with CL label
        elements += `
          <rect x="${x}" y="${y}" width="${width}" height="${height}"
                fill="#e0e0e0" stroke="#666" stroke-width="1.5"/>
          <text x="${x + width/2}" y="${y + height/2}"
                text-anchor="middle" dominant-baseline="middle"
                font-size="10" font-family="Arial" fill="#666">CL</text>
        `;
        break;

      case 'door':
        // Door swing arc
        const doorWidth = Math.min(width, height);
        elements += `
          <path d="M ${x} ${y} Q ${x + doorWidth} ${y} ${x + doorWidth} ${y + doorWidth}"
                fill="none" stroke="#666" stroke-width="1.5"/>
          <line x1="${x}" y1="${y}" x2="${x + doorWidth}" y2="${y}"
                stroke="#333" stroke-width="2"/>
        `;
        break;

      case 'window':
        // Window representation
        elements += `
          <rect x="${x}" y="${y}" width="${width}" height="${height}"
                fill="#cce5ff" stroke="#666" stroke-width="1.5"/>
          <line x1="${x}" y1="${y}" x2="${x + width}" y2="${y + height}"
                stroke="#666" stroke-width="1"/>
          <line x1="${x + width}" y1="${y}" x2="${x}" y2="${y + height}"
                stroke="#666" stroke-width="1"/>
        `;
        break;

      case 'fixture':
        // Generic fixture (toilet, sink, etc)
        const label = element.label || element.name.substring(0, 2).toUpperCase();
        elements += `
          <rect x="${x}" y="${y}" width="${width}" height="${height}"
                fill="#f0f0f0" stroke="#999" stroke-width="1" rx="2"/>
          <text x="${x + width/2}" y="${y + height/2}"
                text-anchor="middle" dominant-baseline="middle"
                font-size="8" font-family="Arial" fill="#666">${label}</text>
        `;
        break;
    }
  }

  // Generate dimension labels
  let dimensions = '';

  // Overall width dimension (top)
  dimensions += `
    <line x1="0" y1="-15" x2="${svgWidth}" y2="-15"
          stroke="#999" stroke-width="0.5" marker-start="url(#arrowStart)" marker-end="url(#arrowEnd)"/>
    <text x="${svgWidth/2}" y="-18" text-anchor="middle"
          font-size="10" font-family="Arial" fill="#666">${spec.width}'</text>
  `;

  // Overall length dimension (left)
  dimensions += `
    <line x1="-15" y1="0" x2="-15" y2="${svgHeight}"
          stroke="#999" stroke-width="0.5" marker-start="url(#arrowStart)" marker-end="url(#arrowEnd)"/>
    <text x="-18" y="${svgHeight/2}" text-anchor="middle"
          font-size="10" font-family="Arial" fill="#666" transform="rotate(-90 -18 ${svgHeight/2})">${spec.length}'</text>
  `;

  // Arrow markers for dimensions
  const markers = `
    <defs>
      <marker id="arrowStart" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M 5 3 L 1 1 L 1 5 Z" fill="#999"/>
      </marker>
      <marker id="arrowEnd" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M 1 3 L 5 1 L 5 5 Z" fill="#999"/>
      </marker>
    </defs>
  `;

  return `<svg viewBox="-30 -30 ${svgWidth + 60} ${svgHeight + 60}" xmlns="http://www.w3.org/2000/svg">
  ${markers}
  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="white" stroke="#000" stroke-width="3"/>
  ${elements}
  ${dimensions}
</svg>`;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🏗️ Arch AI request:', prompt);

    const systemPrompt = `You are Arch, an expert architectural assistant that generates floor plan specifications from natural language descriptions.

USER REQUEST: ${prompt}

YOUR TASK: Generate a detailed floor plan specification as JSON.

IMPORTANT GUIDELINES:
1. Use feet for all measurements
2. Place rooms, doors, windows, closets, and fixtures logically
3. Coordinates start at (0, 0) = top-left corner
4. Standard dimensions:
   - Bedrooms: 10-15 ft per side
   - Bathrooms: 5-8 ft per side
   - Closets: 2-4 ft deep, 3-8 ft wide
   - Doors: 3 ft wide
   - Windows: 3-6 ft wide, 1 ft tall
   - Kitchen: 10-12 ft per side
   - Living areas: 12-20 ft per side
5. Leave appropriate space between elements (walls are 0.5 ft thick conceptually)
6. For ADUs and small buildings, keep total size under 1200 sq ft unless specified
7. Position labels at meaningful locations (center of rooms)

RESPOND WITH ONLY THIS JSON STRUCTURE:
{
  "name": "Descriptive name (e.g., '15x15 Bedroom with Closet')",
  "width": <total width in feet>,
  "length": <total length in feet>,
  "elements": [
    {
      "type": "room" | "door" | "window" | "closet" | "fixture",
      "name": "element name",
      "x": <x position in feet from top-left>,
      "y": <y position in feet from top-left>,
      "width": <width in feet>,
      "height": <height in feet>,
      "label": "display label (for rooms/fixtures)"
    }
  ]
}

EXAMPLE for "15x15 bedroom with closet on left":
{
  "name": "15x15 Bedroom with Closet",
  "width": 15,
  "length": 15,
  "elements": [
    {
      "type": "room",
      "name": "Bedroom",
      "x": 0,
      "y": 0,
      "width": 15,
      "height": 15,
      "label": "BEDROOM"
    },
    {
      "type": "closet",
      "name": "Closet",
      "x": 0.5,
      "y": 0.5,
      "width": 3,
      "height": 5,
      "label": "CL"
    },
    {
      "type": "door",
      "name": "Entry Door",
      "x": 7,
      "y": 15,
      "width": 3,
      "height": 0.5
    },
    {
      "type": "window",
      "name": "Window",
      "x": 11,
      "y": 0,
      "width": 4,
      "height": 0.5
    }
  ]
}

RESPOND WITH VALID JSON ONLY. NO MARKDOWN. NO OTHER TEXT.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: systemPrompt
        }
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      let jsonText = content.text.trim();

      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      try {
        const spec: ShapeSpec = JSON.parse(jsonText);

        // Validate the specification
        if (!spec.name || !spec.width || !spec.length || !spec.elements) {
          throw new Error('Invalid specification structure');
        }

        // Generate SVG from the specification
        const svg = generateSvgFromSpec(spec);

        console.log('✅ Generated shape:', spec.name);
        console.log('📐 Dimensions:', spec.width, 'x', spec.length, 'ft');
        console.log('🔧 Elements:', spec.elements.length);
        console.log('🎨 SVG length:', svg.length);
        console.log('🔍 SVG preview (first 300 chars):', svg.substring(0, 300));

        return NextResponse.json({
          name: spec.name,
          width: spec.width,
          length: spec.length,
          svg,
          elements: spec.elements
        });

      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('Raw response:', jsonText);

        return NextResponse.json(
          { error: 'Failed to parse AI response', details: String(parseError) },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Unexpected response format from AI' },
      { status: 500 }
    );

  } catch (error) {
    console.error('❌ Error in arch AI:', error);
    return NextResponse.json(
      { error: 'Failed to generate shape', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
