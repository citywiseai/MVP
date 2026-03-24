'use client';

import { useMemo } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, Circle } from 'lucide-react';
import { calculateProjectTimeline, formatDuration, formatDate } from '@/lib/timelineCalculator';

interface Phase {
  id: string;
  name: string;
  order: number;
  status: string;
  estimatedDays?: number;
  startDate?: string;
  endDate?: string;
  tasks?: any[];
}

interface ProjectTimelineProps {
  phases: Phase[];
  permitTimeline?: any;
  projectStartDate?: Date;
  targetCompletionDate?: Date;
}

export default function ProjectTimeline({
  phases,
  permitTimeline,
  projectStartDate,
  targetCompletionDate
}: ProjectTimelineProps) {
  const timeline = useMemo(() => {
    return calculateProjectTimeline(
      phases,
      projectStartDate || new Date(),
      [], // vendorBids - could be passed in
      permitTimeline
    );
  }, [phases, permitTimeline, projectStartDate]);

  const isOverdue = targetCompletionDate && timeline.estimatedCompletion > targetCompletionDate;

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Project Timeline</h3>
        </div>
        <div className="text-sm text-gray-500">
          Total: {formatDuration(timeline.totalDays)}
        </div>
      </div>

      {/* Estimated Completion */}
      <div className={`rounded-lg p-3 mb-4 ${isOverdue ? 'bg-red-50 border border-red-200' : 'bg-blue-50'}`}>
        <div className="flex justify-between items-center">
          <div>
            <div className={`text-sm ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
              Estimated Completion
            </div>
            <div className={`text-xl font-bold ${isOverdue ? 'text-red-700' : 'text-blue-700'}`}>
              {formatDate(timeline.estimatedCompletion)}
            </div>
          </div>
          {isOverdue && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">Past target</span>
            </div>
          )}
        </div>
        {targetCompletionDate && (
          <div className="text-xs text-gray-500 mt-1">
            Target: {formatDate(targetCompletionDate)}
          </div>
        )}
      </div>

      {/* Phase Timeline */}
      <div className="space-y-2">
        {timeline.phases.map((phase, index) => (
          <div
            key={phase.id}
            className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {phase.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : phase.status === 'in_progress' ? (
                <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
            </div>

            {/* Phase Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{phase.name}</span>
                <span className="text-xs text-gray-400">
                  {formatDuration(phase.estimatedDays)}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(phase.startDate)} → {formatDate(phase.endDate)}
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex-shrink-0 w-16">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${phase.status === 'completed' ? 'bg-green-500'
                      : phase.status === 'in_progress' ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`}
                  style={{
                    width: phase.status === 'completed' ? '100%'
                      : phase.status === 'in_progress' ? '50%'
                        : '0%'
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Note */}
      <div className="mt-4 text-xs text-gray-400 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        <span>Timeline adjusts automatically based on vendor bids and permit processing times</span>
      </div>
    </div>
  );
}
