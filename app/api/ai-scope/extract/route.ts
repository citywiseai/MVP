import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Ask Claude to extract structured data from the conversation
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are a data extraction assistant. Review the conversation and extract project details into JSON format.

Extract:
- fullAddress: complete street address
- projectType: (new build, addition, remodel, ADU, pool, garage, etc.)
- squareFootage: number only
- stories: number only
- features: array of features mentioned (bathroom, kitchen, garage, etc.)
- description: brief summary of the project

Return ONLY valid JSON, nothing else. If a field is not mentioned, use null.

Example:
{
  "fullAddress": "123 Main St, Phoenix, AZ 85001",
  "projectType": "addition",
  "squareFootage": 500,
  "stories": 1,
  "features": ["bathroom", "bedroom"],
  "description": "500 sq ft single-story addition with new bedroom and full bathroom"
}`,
      messages: messages,
    });

    const extractedText = response.content[0].text;
    
    // Parse the JSON response
    let projectData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      projectData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse extracted data:', extractedText);
      throw new Error('Failed to extract project data');
    }

    return NextResponse.json({ projectData });
  } catch (error) {
    console.error('Error extracting data:', error);
    return NextResponse.json(
      { error: 'Failed to extract project data' },
      { status: 500 }
    );
  }
}
