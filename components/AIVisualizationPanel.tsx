'use client';

import React, { useState, useRef } from 'react';
import { Sparkles, Image as ImageIcon, Upload, X, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AIVisualizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  propertyImage?: string; // Base64 or URL of the property aerial view
  projectId: string;
  onVisualizationSaved?: () => void;
}

export default function AIVisualizationPanel({
  isOpen,
  onClose,
  propertyImage,
  projectId,
  onVisualizationSaved,
}: AIVisualizationPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [quality, setQuality] = useState<'preview' | 'studio'>('preview');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + referenceImages.length > 14) {
      toast.error('Maximum 14 reference images allowed');
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setReferenceImages((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a description of what you want to visualize');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // Generate visualization
      const response = await fetch('/api/ai/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          baseImage: propertyImage,
          referenceImages,
          quality,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate visualization');
      }

      const data = await response.json();
      const imageData = data.imageData;
      setGeneratedImage(imageData);

      // Save to database
      try {
        const saveResponse = await fetch(`/api/projects/${projectId}/visualizations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData,
            prompt,
          }),
        });

        if (saveResponse.ok) {
          console.log('✅ Visualization saved to database');
          onVisualizationSaved?.();
        } else {
          console.error('Failed to save visualization to database');
        }
      } catch (saveError) {
        console.error('Error saving visualization:', saveError);
        // Don't fail the whole operation if save fails
      }

      toast.success('Visualization generated successfully!');
    } catch (error) {
      console.error('Visualization error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate visualization');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `rezio-visualization-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold">AI Visualization Studio</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quality Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generation Quality
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setQuality('preview')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  quality === 'preview'
                    ? 'border-purple-600 bg-purple-50 text-purple-900'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">Preview</div>
                <div className="text-xs text-gray-600">Fast generation</div>
              </button>
              <button
                onClick={() => setQuality('studio')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  quality === 'studio'
                    ? 'border-purple-600 bg-purple-50 text-purple-900'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">Studio Quality</div>
                <div className="text-xs text-gray-600">High quality, slower</div>
              </button>
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to visualize? *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
              placeholder="Example: A modern two-story ADU with white stucco exterior, gray roof, and large windows. Include landscaping with native desert plants and a small patio area."
            />
          </div>

          {/* Reference Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Images (Optional - Up to 14)
            </label>
            <div className="space-y-3">
              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-purple-600"
              >
                <Upload className="w-5 h-5" />
                <span>Upload Reference Images</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Reference Image Grid */}
              {referenceImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {referenceImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Reference ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => removeReferenceImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Visualization...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Visualization</span>
              </>
            )}
          </button>

          {/* Generated Image Display */}
          {generatedImage && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Generated Visualization</h3>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={generatedImage}
                  alt="Generated visualization"
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
