/**
 * VisionEngine - Gemini AI Image Generation Service
 * Handles AI visualization of proposed structures using Google's Gemini models
 */

export type GeminiModel = 'gemini-2.0-flash-exp';

export interface VisionRequest {
  prompt: string;
  baseImage?: string;
  referenceImages?: string[];
  model?: GeminiModel;
}

export interface VisionResponse {
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  error?: string;
  model: GeminiModel;
  promptUsed: string;
}

const DEFAULT_MODEL: GeminiModel = 'gemini-2.0-flash-exp';

export async function generateVisualization(request: VisionRequest): Promise<VisionResponse> {
  const model = request.model || DEFAULT_MODEL;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (request.baseImage) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: request.baseImage.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
      parts.push({ text: 'This is the current aerial view of the property lot. ' });
    }

    if (request.referenceImages?.length) {
      for (const img of request.referenceImages.slice(0, 14)) {
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: img.replace(/^data:image\/\w+;base64,/, ''),
          },
        });
      }
      parts.push({ text: `Reference images showing desired style. ` });
    }

    parts.push({ text: request.prompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(
      (p: any) => p.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart?.inlineData) {
      const textPart = candidate?.content?.parts?.find((p: any) => p.text);
      throw new Error(textPart?.text || 'No image generated');
    }

    return {
      success: true,
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
      model,
      promptUsed: request.prompt,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      model,
      promptUsed: request.prompt,
    };
  }
}

export async function generatePreview(request: Omit<VisionRequest, 'model'>): Promise<VisionResponse> {
  return generateVisualization({ ...request, model: 'gemini-2.0-flash-exp' });
}

export async function generateStudioQuality(request: Omit<VisionRequest, 'model'>): Promise<VisionResponse> {
  return generateVisualization({ ...request, model: 'gemini-2.0-flash-exp' });
}
