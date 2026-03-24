'use client';

import { useState } from 'react';
import {
  Home, Bed, Bath, Layers, Ruler, Sparkles,
  Download, RefreshCw, Check, Upload
} from 'lucide-react';

interface FloorPlanGeneratorProps {
  projectId: string;
  lotSizeSqFt?: number;
  maxLotCoverage?: number;
  onGenerated?: (floorPlan: any) => void;
  onSaved?: () => void;
}

const HOUSE_STYLES = [
  { value: 'modern', label: 'Modern' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'craftsman', label: 'Craftsman' },
  { value: 'ranch', label: 'Ranch' },
  { value: 'colonial', label: 'Colonial' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'contemporary', label: 'Contemporary' },
  { value: 'farmhouse', label: 'Farmhouse' },
];

export default function FloorPlanGenerator({
  projectId,
  lotSizeSqFt,
  maxLotCoverage,
  onGenerated,
  onSaved,
}: FloorPlanGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [model, setModel] = useState<'sdxl' | 'gemini'>('gemini');
  const [squareFootage, setSquareFootage] = useState(2000);
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [stories, setStories] = useState(1);
  const [style, setStyle] = useState('modern');
  const [additionalPrompt, setAdditionalPrompt] = useState('');

  const maxBuildableArea = lotSizeSqFt && maxLotCoverage
    ? Math.floor(lotSizeSqFt * (maxLotCoverage / 100))
    : null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const endpoint = model === 'gemini'
        ? '/api/generate-floorplan-gemini'
        : '/api/generate-floorplan';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          squareFootage,
          bedrooms,
          bathrooms,
          stories,
          style,
          prompt: additionalPrompt,
        }),
      });

      const data = await response.json();

      console.log('🎨 Generation response:', data);
      console.log('📸 Image URL:', data.imageUrl);
      console.log('📊 Image URL type:', typeof data.imageUrl);
      console.log('🔍 Full data structure:', JSON.stringify(data, null, 2));

      if (data.success && data.imageUrl) {
        // Handle different Replicate output formats
        let imageUrl = data.imageUrl;

        // If it's an array, get the first item
        if (Array.isArray(imageUrl)) {
          console.log('📦 Image URL is array, taking first item');
          imageUrl = imageUrl[0];
        }

        // If it's an object with a url property
        if (typeof imageUrl === 'object' && imageUrl?.url) {
          console.log('📦 Image URL is object with url property');
          imageUrl = imageUrl.url;
        }

        console.log('✅ Final image URL:', imageUrl);

        setGeneratedImage(imageUrl);
        setGeneratedPrompt(data.prompt);
        onGenerated?.(data);
      } else {
        // Check for specific error types
        if (data.needsCredits) {
          setError(`${data.error}: ${data.details}`);
        } else {
          setError(data.details || data.error || 'Failed to generate floor plan');
        }
      }
    } catch (err) {
      setError('Error connecting to generation service');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedImage) return;
    setIsSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/floorplans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: generatedImage,
          squareFootage,
          bedrooms,
          bathrooms,
          stories,
          style,
          generatedBy: 'ai',
          prompt: generatedPrompt,
        }),
      });

      if (response.ok) {
        onSaved?.();
        setGeneratedImage(null);
      } else {
        setError('Failed to save floor plan');
      }
    } catch (err) {
      console.error('Error saving floor plan:', err);
      setError('Error saving floor plan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h2 className="font-semibold">AI Floor Plan Generator (Beta)</h2>
        </div>
        <p className="text-sm text-white/80 mt-1">
          AI Concept Generation - For inspiration only. Not for construction use.
        </p>
      </div>

      <div className="p-4">
        {/* Model Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Model
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setModel('gemini')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                model === 'gemini'
                  ? 'border-purple-600 bg-purple-50 text-purple-900'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">Gemini 2.0</div>
              <div className="text-xs text-gray-600">Fast, free generation</div>
            </button>
            <button
              onClick={() => setModel('sdxl')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                model === 'sdxl'
                  ? 'border-purple-600 bg-purple-50 text-purple-900'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold">SDXL (Replicate)</div>
              <div className="text-xs text-gray-600">Requires credits</div>
            </button>
          </div>
        </div>

        {maxBuildableArea && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <div className="text-sm text-blue-800">
              <strong>Lot Constraints:</strong>
              <span className="ml-2">
                Max Footprint: {maxBuildableArea.toLocaleString()} sqft ({maxLotCoverage}% of {lotSizeSqFt?.toLocaleString()} sqft lot)
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Ruler className="w-3 h-3 inline mr-1" />
              Square Footage
            </label>
            <input
              type="number"
              value={squareFootage}
              onChange={(e) => setSquareFootage(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-lg text-black"
              min={500}
              max={10000}
              step={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Bed className="w-3 h-3 inline mr-1" />
              Bedrooms
            </label>
            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-black bg-white"
            >
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n} Bedroom{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Bath className="w-3 h-3 inline mr-1" />
              Bathrooms
            </label>
            <select
              value={bathrooms}
              onChange={(e) => setBathrooms(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-black bg-white"
            >
              {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(n => (
                <option key={n} value={n}>{n} Bath{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Layers className="w-3 h-3 inline mr-1" />
              Stories
            </label>
            <select
              value={stories}
              onChange={(e) => setStories(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-black bg-white"
            >
              <option value={1}>1 Story</option>
              <option value={2}>2 Stories</option>
              <option value={3}>3 Stories</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Home className="w-3 h-3 inline mr-1" />
              Style
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-black bg-white"
            >
              {HOUSE_STYLES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Requirements (optional)
          </label>
          <textarea
            value={additionalPrompt}
            onChange={(e) => setAdditionalPrompt(e.target.value)}
            placeholder="e.g., open concept kitchen, home office, large master suite, attached garage..."
            className="w-full px-3 py-2 border rounded-lg text-black placeholder:text-gray-400 resize-none"
            rows={2}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating Floor Plan... ({model === 'gemini' ? '10-20 seconds' : '30-60 seconds'})
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Floor Plan with {model === 'gemini' ? 'Gemini' : 'SDXL'}
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {generatedImage && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Generated Floor Plan</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  {isSaving ? 'Saving...' : 'Save to Project'}
                </button>
                <a
                  href={generatedImage}
                  download="floorplan.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden bg-gray-100">
              <img
                src={generatedImage}
                alt="Generated floor plan"
                className="w-full h-auto"
                onLoad={() => console.log('✅ Image loaded successfully:', generatedImage)}
                onError={(e) => {
                  console.error('❌ Image failed to load:', generatedImage);
                  console.error('Error event:', e);
                  setError(`Failed to load generated image. URL: ${generatedImage}`);
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {squareFootage.toLocaleString()} sqft • {bedrooms} bed • {bathrooms} bath • {stories} story • {style} • Generated with {model === 'gemini' ? 'Gemini 2.0' : 'SDXL'}
            </p>
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> AI-generated floor plans are conceptual only. Not suitable for construction, permits, or official use. Consult a licensed architect for professional drawings.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
