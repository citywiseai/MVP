"use client";

import React from 'react';
import { Eye, Edit2, Ruler, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapToolbarProps {
  mode: 'view' | 'edit' | 'draw' | 'measure';
  onModeChange: (mode: 'view' | 'edit' | 'draw' | 'measure') => void;
}

export default function MapToolbar({
  mode,
  onModeChange
}: MapToolbarProps) {
  
  const modes = [
    { id: 'view' as const, label: 'View', icon: Eye, shortcut: '1 or V' },
    { id: 'edit' as const, label: 'Edit', icon: Edit2, shortcut: '2 or E' },
    { id: 'draw' as const, label: 'Draw', icon: PenTool, shortcut: '3 or D' },
    { id: 'measure' as const, label: 'Measure', icon: Ruler, shortcut: '4 or M' }
  ];

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 px-2 py-2 flex items-center gap-2">
        {/* Mode Buttons */}
        <div className="flex items-center gap-1">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;

            return (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id)}
                title={`${m.label} (${m.shortcut})`}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm
                  transition-all duration-200
                  ${isActive
                    ? 'bg-[#007AFF] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
