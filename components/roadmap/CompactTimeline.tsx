'use client';

import React from 'react';
import { ProjectRoadmap, RoadmapPhase } from '@/types/roadmap';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

interface CompactTimelineProps {
  roadmap: ProjectRoadmap;
  onPhaseClick?: (phase: RoadmapPhase) => void;
}

export default function CompactTimeline({ roadmap, onPhaseClick }: CompactTimelineProps) {
  // Calculate proportional widths based on estimated duration
  const calculateWidth = (duration: string): number => {
    // Extract max weeks from duration string (e.g., "2-4 weeks" -> 4)
    const match = duration.match(/(\d+)-?(\d+)?\s*weeks?/i);
    if (!match) return 10;

    const maxWeeks = match[2] ? parseInt(match[2]) : parseInt(match[1]);
    return maxWeeks;
  };

  const phases = roadmap.phases || [];
  const totalWeeks = phases.reduce((sum, phase) => sum + calculateWidth(phase.estimatedDuration || '1 week'), 0);

  const getPhaseWidth = (phase: RoadmapPhase): number => {
    const weeks = calculateWidth(phase.estimatedDuration || '1 week');
    return (weeks / totalWeeks) * 100;
  };

  const getStatusColor = (status: string, isActive: boolean) => {
    if (status === 'completed') {
      return 'from-green-500 to-green-600';
    } else if (status === 'in_progress') {
      return 'from-blue-500 to-blue-600';
    } else {
      return 'from-gray-300 to-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-white drop-shadow-lg" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-white drop-shadow-lg animate-pulse" />;
      default: return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };

  const completedCount = phases.filter(p => p.status === 'completed').length;
  const progressPercentage = (completedCount / phases.length) * 100;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">PROJECT TRACKER</h3>
          <p className="text-sm text-gray-600">
            {completedCount === 0 && 'Your project journey has begun!'}
            {completedCount > 0 && completedCount < phases.length && `Phase ${completedCount + 1} of ${phases.length} in progress`}
            {completedCount === phases.length && '🎉 All phases complete!'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{Math.round(progressPercentage)}%</div>
          <div className="text-xs text-gray-500">COMPLETE</div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="relative bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl p-6 shadow-lg border-2 border-gray-300">
        {/* Main progress bar container */}
        <div className="flex items-stretch h-24 rounded-xl overflow-hidden shadow-inner relative">
          {phases.map((phase, index) => {
            const width = getPhaseWidth(phase);
            const isActive = phase.status === 'in_progress';
            const isCompleted = phase.status === 'completed';

            return (
              <div
                key={phase.id}
                style={{ width: `${width}%` }}
                className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 ${
                  index < phases.length - 1 ? 'border-r-2 border-white/30' : ''
                }`}
                onClick={() => onPhaseClick?.(phase)}
              >
                {/* Phase segment with gradient */}
                <div className={`h-full bg-gradient-to-br ${getStatusColor(phase.status, isActive)} relative overflow-hidden`}>
                  {/* Glossy overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10" />

                  {/* Active phase pulse animation */}
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-400 animate-pulse opacity-30" />
                  )}

                  {/* Diagonal stripe pattern for waiting phases */}
                  {phase.status === 'waiting' && (
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px)'
                      }}
                    />
                  )}

                  {/* Phase content */}
                  <div className="relative h-full flex flex-col items-center justify-center p-2 text-center">
                    {/* Status icon */}
                    <div className="mb-1">
                      {getStatusIcon(phase.status)}
                    </div>

                    {/* Phase number badge */}
                    <div className={`text-xs font-bold mb-1 px-2 py-0.5 rounded-full ${
                      isCompleted ? 'bg-white/30 text-white' :
                      isActive ? 'bg-white text-blue-600' :
                      'bg-black/20 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Phase name */}
                    <div className={`text-xs font-bold leading-tight ${
                      phase.status === 'waiting' ? 'text-gray-700' : 'text-white drop-shadow-md'
                    }`}>
                      {phase.name.split('&').map((part, i) => (
                        <div key={i}>{part.trim()}</div>
                      ))}
                    </div>

                    {/* Duration */}
                    <div className={`text-[10px] mt-1 ${
                      phase.status === 'waiting' ? 'text-gray-600' : 'text-white/80'
                    }`}>
                      {phase.estimatedDuration}
                    </div>
                  </div>

                  {/* Hover tooltip */}
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl whitespace-nowrap">
                      <div className="font-bold">{phase.name}</div>
                      <div className="text-gray-300">{phase.description}</div>
                      <div className="text-gray-400 mt-1">Duration: {phase.estimatedDuration}</div>
                      {/* Arrow */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Phase labels below */}
        <div className="flex mt-4">
          {phases.map((phase, index) => {
            const width = getPhaseWidth(phase);
            return (
              <div
                key={`label-${phase.id}`}
                style={{ width: `${width}%` }}
                className="text-center px-1"
              >
                <div className={`text-[10px] font-medium ${
                  phase.status === 'completed' ? 'text-green-600' :
                  phase.status === 'in_progress' ? 'text-blue-600' :
                  'text-gray-500'
                }`}>
                  {phase.status === 'completed' && '✓ Complete'}
                  {phase.status === 'in_progress' && '⏱ In Progress'}
                  {phase.status === 'waiting' && 'Waiting'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-green-600" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 animate-pulse" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-300 to-gray-400" />
          <span>Waiting</span>
        </div>
      </div>
    </div>
  );
}
