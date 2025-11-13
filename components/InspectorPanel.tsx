"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ValidationRule {
  name: string;
  required: number;
  actual: number;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

interface InspectorPanelProps {
  parcelData?: any;
  buildableArea: number | null;
  setbacks: {
    front: number;
    rear: number;
    left: number;
    right: number;
  };
  drawnShapes: Array<{
    id: string;
    name: string;
    area: number;
    perimeter: number;
  }>;
  onSetbackChange?: (side: string, value: number) => void;
  isEditingSetbacks?: boolean;
}

export default function InspectorPanel({
  parcelData,
  buildableArea,
  setbacks,
  drawnShapes,
  onSetbackChange,
  isEditingSetbacks = false
}: InspectorPanelProps) {
  
  // Calculate validation rules
  const getValidationRules = (): ValidationRule[] => {
    if (!parcelData) return [];
    
    const rules: ValidationRule[] = [];
    
    // Zoning-specific setback requirements (Phoenix R1-10 example)
    const zoningCode = parcelData.zoningCode || parcelData.zoning;
    let minFront = 20, minRear = 15, minSide = 5;
    
    // Adjust based on actual zoning code
    if (zoningCode?.includes('R1-10')) {
      minFront = 20;
      minRear = 15;
      minSide = 5;
    } else if (zoningCode?.includes('R1-6')) {
      minFront = 20;
      minRear = 20;
      minSide = 5;
    }
    
    // Front setback validation
    rules.push({
      name: 'Front Setback',
      required: minFront,
      actual: setbacks.front,
      status: setbacks.front >= minFront ? 'pass' : 'fail',
      message: setbacks.front >= minFront 
        ? `Complies (${setbacks.front}' ≥ ${minFront}')` 
        : `Requires ${minFront}', currently ${setbacks.front}'`
    });
    
    // Rear setback validation
    rules.push({
      name: 'Rear Setback',
      required: minRear,
      actual: setbacks.rear,
      status: setbacks.rear >= minRear ? 'pass' : 'fail',
      message: setbacks.rear >= minRear 
        ? `Complies (${setbacks.rear}' ≥ ${minRear}')` 
        : `Requires ${minRear}', currently ${setbacks.rear}'`
    });
    
    // Side setbacks validation
    const minSideActual = Math.min(setbacks.left, setbacks.right);
    rules.push({
      name: 'Side Setbacks',
      required: minSide,
      actual: minSideActual,
      status: minSideActual >= minSide ? 'pass' : 'fail',
      message: minSideActual >= minSide 
        ? `Both sides comply (≥ ${minSide}')` 
        : `Minimum ${minSide}' required on each side`
    });
    
    // Lot coverage validation (example: 40% max for R1-10)
    if (parcelData.lotSizeSqFt && drawnShapes.length > 0) {
      const totalBuilding = drawnShapes.reduce((sum, s) => sum + s.area, 0);
      const coveragePercent = (totalBuilding / parcelData.lotSizeSqFt) * 100;
      const maxCoverage = 40;
      
      rules.push({
        name: 'Lot Coverage',
        required: maxCoverage,
        actual: coveragePercent,
        status: coveragePercent <= maxCoverage ? 'pass' : 'fail',
        message: coveragePercent <= maxCoverage
          ? `${coveragePercent.toFixed(1)}% (max ${maxCoverage}%)`
          : `${coveragePercent.toFixed(1)}% exceeds ${maxCoverage}% maximum`
      });
    }
    
    return rules;
  };
  
  const validationRules = getValidationRules();
  const hasFailures = validationRules.some(r => r.status === 'fail');
  const allPass = validationRules.every(r => r.status === 'pass');
  
  return (
    <div>
      <div className="mb-3">
        <h3 className="text-lg font-bold text-gray-900">Property Inspector</h3>
        <p className="text-xs text-gray-500">Real-time analysis & validation</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overall Status */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3">Overall Status</h4>
          <div className="flex items-center gap-2 mb-2">
            {allPass ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : hasFailures ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <Info className="h-5 w-5 text-yellow-600" />
            )}
            <span className="font-semibold text-sm">
              {allPass ? 'All Pass' : hasFailures ? 'Violations' : 'Review'}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            {validationRules.filter(r => r.status === 'pass').length} of {validationRules.length} checks passing
          </div>
        </Card>
        
        {/* Card 2: Property Stats */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3">Property Stats</h4>
          <div className="space-y-2">
            {parcelData?.lotSizeSqFt && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Lot Size</span>
                <span className="font-semibold">{(parcelData.lotSizeSqFt / 1000).toFixed(1)}K sf</span>
              </div>
            )}
            {buildableArea !== null && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Buildable</span>
                <span className="font-semibold text-green-600">{(buildableArea / 1000).toFixed(1)}K sf</span>
              </div>
            )}
            {drawnShapes.length > 0 && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Building</span>
                  <span className="font-semibold">
                    {(drawnShapes.reduce((sum, s) => sum + s.area, 0) / 1000).toFixed(1)}K sf
                  </span>
                </div>
                {parcelData?.lotSizeSqFt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Coverage</span>
                    <span className="font-semibold">
                      {((drawnShapes.reduce((sum, s) => sum + s.area, 0) / parcelData.lotSizeSqFt) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </>
            )}
            {parcelData?.zoningCode && (
              <div className="flex justify-between text-xs pt-2 border-t">
                <span className="text-gray-600">Zoning</span>
                <span className="font-semibold">{parcelData.zoningCode}</span>
              </div>
            )}
          </div>
        </Card>
        
        {/* Card 3: Setback Values */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3">Setback Values</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="ins-front" className="text-xs text-gray-600 w-12">Front</Label>
              <Input
                id="ins-front"
                type="number"
                value={setbacks.front}
                onChange={(e) => onSetbackChange?.('front', parseFloat(e.target.value))}
                disabled={!isEditingSetbacks}
                className="h-7 text-xs flex-1"
              />
              <span className="text-xs text-gray-500">ft</span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="ins-rear" className="text-xs text-gray-600 w-12">Rear</Label>
              <Input
                id="ins-rear"
                type="number"
                value={setbacks.rear}
                onChange={(e) => onSetbackChange?.('rear', parseFloat(e.target.value))}
                disabled={!isEditingSetbacks}
                className="h-7 text-xs flex-1"
              />
              <span className="text-xs text-gray-500">ft</span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="ins-left" className="text-xs text-gray-600 w-12">Left</Label>
              <Input
                id="ins-left"
                type="number"
                value={setbacks.left}
                onChange={(e) => onSetbackChange?.('left', parseFloat(e.target.value))}
                disabled={!isEditingSetbacks}
                className="h-7 text-xs flex-1"
              />
              <span className="text-xs text-gray-500">ft</span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="ins-right" className="text-xs text-gray-600 w-12">Right</Label>
              <Input
                id="ins-right"
                type="number"
                value={setbacks.right}
                onChange={(e) => onSetbackChange?.('right', parseFloat(e.target.value))}
                disabled={!isEditingSetbacks}
                className="h-7 text-xs flex-1"
              />
              <span className="text-xs text-gray-500">ft</span>
            </div>
          </div>
        </Card>
        
        {/* Card 4: Code Compliance */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-3">Code Compliance</h4>
          <div className="space-y-2">
            {validationRules.map((rule, idx) => (
              <div 
                key={idx}
                className={`p-2 rounded text-xs ${
                  rule.status === 'pass' ? 'bg-green-50 text-green-700' :
                  rule.status === 'fail' ? 'bg-red-50 text-red-700' :
                  'bg-yellow-50 text-yellow-700'
                }`}
              >
                <div className="flex items-start gap-1">
                  {rule.status === 'pass' ? (
                    <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{rule.name}</div>
                    <div className="text-xs opacity-80">{rule.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
