'use client';

import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, ChevronDown, ChevronRight } from 'lucide-react';
import {
  ShapeTemplate,
  SHAPE_TEMPLATES,
  SHAPE_CATEGORIES,
  getTemplatesByCategory,
  getTemplateById,
} from '@/lib/shape-templates';

interface ShapeBuilderPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddShape: (shape: {
    templateId: string;
    name: string;
    width: number;
    height: number;
    rotation: number;
    area: number;
  }) => void;
  maxCoverage?: number; // Maximum lot coverage in sqft
  currentCoverage?: number; // Current coverage in sqft
  lotSize?: number; // Total lot size in sqft
}

export default function ShapeBuilderPanel({
  isOpen,
  onClose,
  onAddShape,
  maxCoverage = 10000,
  currentCoverage = 0,
  lotSize = 0,
}: ShapeBuilderPanelProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('garages');
  const [customWidth, setCustomWidth] = useState<number>(20);
  const [customHeight, setCustomHeight] = useState<number>(20);
  const [rotation, setRotation] = useState<number>(0);
  const [sizeVariant, setSizeVariant] = useState<'small' | 'medium' | 'large'>('medium');

  const selectedTemplate = useMemo(() => {
    return selectedTemplateId ? getTemplateById(selectedTemplateId) : null;
  }, [selectedTemplateId]);

  // Update dimensions when template or size variant changes
  React.useEffect(() => {
    if (selectedTemplate) {
      const variant = selectedTemplate.sizeVariants[sizeVariant];
      setCustomWidth(variant.width);
      setCustomHeight(variant.height);
    }
  }, [selectedTemplate, sizeVariant]);

  const currentShapeArea = customWidth * customHeight;
  const projectedCoverage = currentCoverage + currentShapeArea;
  const coveragePercent = (projectedCoverage / maxCoverage) * 100;
  const willExceedCoverage = projectedCoverage > maxCoverage;

  const handleSelectTemplate = (template: ShapeTemplate) => {
    setSelectedTemplateId(template.id);
    setSizeVariant('medium');
    setRotation(0);
  };

  const handleDimensionChange = (dimension: 'width' | 'height', delta: number) => {
    if (!selectedTemplate) return;

    if (dimension === 'width') {
      const newWidth = Math.max(
        selectedTemplate.minWidth,
        Math.min(selectedTemplate.maxWidth, customWidth + delta)
      );
      setCustomWidth(newWidth);
    } else {
      const newHeight = Math.max(
        selectedTemplate.minHeight,
        Math.min(selectedTemplate.maxHeight, customHeight + delta)
      );
      setCustomHeight(newHeight);
    }
  };

  const handleAddToMap = () => {
    if (!selectedTemplate) return;

    onAddShape({
      templateId: selectedTemplate.id,
      name: selectedTemplate.name,
      width: customWidth,
      height: customHeight,
      rotation,
      area: currentShapeArea,
    });

    // Reset for next shape
    setSelectedTemplateId(null);
    setSizeVariant('medium');
    setRotation(0);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-4 top-4 w-96 max-h-[calc(100vh-8rem)] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden z-50 border-2 border-gray-200">
      {/* Header */}
      <div className="flex-none flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div>
          <h3 className="font-bold text-lg text-gray-900">Shape Builder</h3>
          <p className="text-xs text-gray-600 mt-0.5">Add structures to your property</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/80 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Template Categories */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Templates</h4>

          {SHAPE_CATEGORIES.map((category) => {
            const templates = getTemplatesByCategory(category.id);
            const isExpanded = expandedCategory === category.id;

            return (
              <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.icon}</span>
                    <span className="font-medium text-gray-900">{category.name}</span>
                    <span className="text-xs text-gray-500">({templates.length})</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>

                {/* Templates Grid */}
                {isExpanded && (
                  <div className="p-3 bg-white grid grid-cols-2 gap-2">
                    {templates.map((template) => {
                      const isSelected = selectedTemplateId === template.id;
                      return (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {template.name}
                          </div>
                          <div className="text-xs text-gray-600">{template.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {template.defaultWidth}' × {template.defaultHeight}'
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Configuration Panel (shown when template selected) */}
        {selectedTemplate && (
          <div className="space-y-4 pt-4 border-t-2 border-gray-200">
            {/* Size Variants */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Quick Size</label>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map((variant) => {
                  const size = selectedTemplate.sizeVariants[variant];
                  return (
                    <button
                      key={variant}
                      onClick={() => setSizeVariant(variant)}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        sizeVariant === variant
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="capitalize">{variant}</div>
                      <div className="text-xs opacity-75">
                        {size.width}' × {size.height}'
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Dimensions */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Custom Dimensions
              </label>

              {/* Width Control */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600 w-14">Width:</span>
                <button
                  onClick={() => handleDimensionChange('width', -1)}
                  className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                  disabled={customWidth <= selectedTemplate.minWidth}
                >
                  <Minus className="w-4 h-4 text-gray-700" />
                </button>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  min={selectedTemplate.minWidth}
                  max={selectedTemplate.maxWidth}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-center font-medium"
                />
                <button
                  onClick={() => handleDimensionChange('width', 1)}
                  className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                  disabled={customWidth >= selectedTemplate.maxWidth}
                >
                  <Plus className="w-4 h-4 text-gray-700" />
                </button>
                <span className="text-sm text-gray-500 w-8">ft</span>
              </div>

              {/* Height Control */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-14">Height:</span>
                <button
                  onClick={() => handleDimensionChange('height', -1)}
                  className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                  disabled={customHeight <= selectedTemplate.minHeight}
                >
                  <Minus className="w-4 h-4 text-gray-700" />
                </button>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  min={selectedTemplate.minHeight}
                  max={selectedTemplate.maxHeight}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-center font-medium"
                />
                <button
                  onClick={() => handleDimensionChange('height', 1)}
                  className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                  disabled={customHeight >= selectedTemplate.maxHeight}
                >
                  <Plus className="w-4 h-4 text-gray-700" />
                </button>
                <span className="text-sm text-gray-500 w-8">ft</span>
              </div>
            </div>

            {/* Rotation */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Rotation</label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 90, 180, 270].map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setRotation(angle)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      rotation === angle
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {angle}°
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Preview */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Preview</label>
              <div
                className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-center"
                style={{ minHeight: '200px' }}
              >
                <div
                  style={{ transform: `rotate(${rotation}deg)` }}
                  className="transition-transform duration-300"
                  dangerouslySetInnerHTML={{
                    __html: selectedTemplate.getSvg(customWidth, customHeight),
                  }}
                />
              </div>
            </div>

            {/* Area Calculation */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shape Area:</span>
                <span className="font-semibold text-gray-900">
                  {currentShapeArea.toLocaleString()} sq ft
                </span>
              </div>
              {lotSize > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">% of Lot:</span>
                  <span className="font-semibold text-gray-900">
                    {((currentShapeArea / lotSize) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* Lot Coverage Tracker */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Lot Coverage Tracking
              </label>

              {/* Progress Bar */}
              <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                    willExceedCoverage ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, coveragePercent)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-900">
                  {coveragePercent.toFixed(1)}%
                </div>
              </div>

              {/* Coverage Stats */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Coverage:</span>
                  <span className="font-medium">{currentCoverage.toLocaleString()} sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">After Adding:</span>
                  <span className="font-medium">{projectedCoverage.toLocaleString()} sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Allowed:</span>
                  <span className="font-medium">{maxCoverage.toLocaleString()} sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining:</span>
                  <span className={`font-medium ${willExceedCoverage ? 'text-red-600' : 'text-green-600'}`}>
                    {(maxCoverage - projectedCoverage).toLocaleString()} sq ft
                  </span>
                </div>
              </div>

              {/* Warning */}
              {willExceedCoverage && (
                <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ Warning: This shape will exceed your lot coverage limit!
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Reduce dimensions or remove other structures to stay within limits.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Add to Map Button (always visible when template selected) */}
      {selectedTemplate && (
        <div className="flex-none p-4 border-t border-gray-200 bg-white rounded-b-xl">
          <button
            onClick={handleAddToMap}
            disabled={willExceedCoverage}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
              willExceedCoverage
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {willExceedCoverage ? 'Exceeds Coverage Limit' : 'Add to Map'}
          </button>
        </div>
      )}
    </div>
  );
}
