# AI Visualization Integration (Nano Banana)

## Overview
AI-powered property visualization using Google's Gemini 2.0 image generation models. Generate photorealistic renderings of proposed structures on property lots.

## Components Created

### 1. Vision Engine (`lib/vision-engine.ts`)
Core service for Gemini AI image generation:
- `generateVisualization()` - Main generation function
- `generatePreview()` - Fast preview quality (gemini-2.0-flash)
- `generateStudioQuality()` - High quality (gemini-2.0-pro)

**Features:**
- Base image support (property aerial view)
- Reference images (up to 14 style references)
- Two quality tiers
- Comprehensive error handling

### 2. API Route (`app/api/ai/visualize/route.ts`)
REST endpoint for visualization generation:
- **POST** `/api/ai/visualize`
- Authentication required
- Supports both quality modes

**Request Body:**
```json
{
  "prompt": "A modern two-story ADU with white stucco...",
  "baseImage": "data:image/png;base64,...",
  "referenceImages": ["data:image/png;base64,..."],
  "quality": "preview" | "studio"
}
```

**Response:**
```json
{
  "success": true,
  "imageData": "data:image/png;base64,...",
  "model": "gemini-2.0-flash-preview-image-generation",
  "promptUsed": "..."
}
```

### 3. UI Component (`components/AIVisualizationPanel.tsx`)
Modal panel for visualization generation:
- Quality selector (Preview/Studio)
- Prompt input with examples
- Reference image upload (up to 14 images)
- Generated image preview
- Download functionality
- Loading states and error handling

## Setup Instructions

### 1. Add Gemini API Key
The `.env` file has been updated with a placeholder. Replace it with your actual key:

```bash
# Get API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Restart Development Server
```bash
npm run dev
```

### 3. Integration Example
Add the panel to any page (e.g., property visualization page):

```tsx
import AIVisualizationPanel from '@/components/AIVisualizationPanel';

export default function PropertyPage() {
  const [showAIPanel, setShowAIPanel] = useState(false);

  return (
    <>
      <button onClick={() => setShowAIPanel(true)}>
        Generate AI Visualization
      </button>

      <AIVisualizationPanel
        isOpen={showAIPanel}
        onClose={() => setShowAIPanel(false)}
        propertyImage={propertyAerialImageBase64} // Optional
      />
    </>
  );
}
```

## Usage Guide

### Basic Workflow
1. Click "Generate AI Visualization" button
2. Choose quality mode (Preview for speed, Studio for quality)
3. Enter detailed prompt describing the structure
4. Optionally upload reference images for style
5. Click "Generate Visualization"
6. Download or use the generated image

### Prompt Tips
**Good prompts are:**
- Detailed and specific
- Include style, materials, colors
- Mention landscaping and context
- Specify viewpoint (aerial, street-level, etc.)

**Example:**
```
A modern two-story ADU with white stucco exterior, dark gray standing seam metal roof,
and large aluminum-framed windows. The structure should have clean lines with a flat
parapet on one side. Include desert landscaping with native plants, gravel pathway,
and a small covered patio with pergola. Aerial view showing the ADU positioned in the
backyard of the main house.
```

## API Models

### Preview Mode
- **Model**: `gemini-2.0-flash-preview-image-generation`
- **Speed**: Fast (~10-15 seconds)
- **Quality**: Good
- **Use Case**: Quick previews, iterations

### Studio Mode
- **Model**: `gemini-2.0-pro-exp-image-generation`
- **Speed**: Slower (~30-60 seconds)
- **Quality**: High
- **Use Case**: Final presentations, client reviews

## Features

✅ **Property Context** - Use aerial view as base image
✅ **Style References** - Upload up to 14 reference images
✅ **Quality Control** - Choose between speed and quality
✅ **Download** - Save generated images
✅ **Error Handling** - Comprehensive error messages
✅ **Authentication** - Secured with NextAuth

## Technical Details

### Image Processing
- Accepts base64-encoded images
- Strips data URI prefixes automatically
- Supports PNG, JPEG formats
- Maximum 14 reference images (Gemini limit)

### Error Handling
- API key validation
- Gemini API error parsing
- User-friendly error messages
- Console logging for debugging

### Security
- Authentication required for API access
- Environment variable for API key
- Server-side API calls only

## Future Enhancements

**Potential additions:**
- [ ] Save generated visualizations to project
- [ ] History of generated images
- [ ] Batch generation
- [ ] Custom model parameters
- [ ] Integration with property plans
- [ ] Before/after comparisons
- [ ] Export to PDF reports

## Troubleshooting

### "GEMINI_API_KEY not set" error
- Check `.env` file has valid API key
- Restart development server after adding key

### "No image generated" error
- Check prompt is detailed enough
- Try simpler prompt first
- Reduce number of reference images

### Slow generation
- Use Preview mode for faster results
- Studio mode naturally takes longer

## Support

For issues or questions:
1. Check console logs for detailed errors
2. Verify API key is valid
3. Test with simple prompts first
4. Check Gemini API status

## Resources

- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Image Generation Guide](https://ai.google.dev/gemini-api/docs/vision)
- [API Pricing](https://ai.google.dev/pricing)
