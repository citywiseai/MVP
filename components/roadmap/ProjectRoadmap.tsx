'use client';

import React, { useState, useEffect } from 'react';
import { ProjectRoadmap as ProjectRoadmapType, RoadmapPhase } from '@/types/roadmap';
import {
  PHASE_STATUS,
  PROJECT_PHASES,
  calculateOverallProgress,
  getCurrentPhase,
  calculateEstimatedCompletion,
  getDaysInPhase,
  getNextAction
} from '@/lib/phases';
import {
  Check,
  Play,
  X,
  RotateCcw,
  AlertCircle,
  Search,
  PenTool,
  Calculator,
  FolderOpen,
  Building2,
  Award,
  Lock,
  CheckCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProjectRoadmapProps {
  projectId: string;
  onRefresh?: () => void;
}

export default function ProjectRoadmap({ projectId, onRefresh }: ProjectRoadmapProps) {
  const [roadmap, setRoadmap] = useState<ProjectRoadmapType | null>(null);
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showAutoAdvanceToast, setShowAutoAdvanceToast] = useState(false);
  const [toastPhaseId, setToastPhaseId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Calculate completed percentage based on phase widths (for animated fill)
  const calculateCompletedPercent = () => {
    if (!roadmap?.phases || roadmap.phases.length === 0) return 0;

    return roadmap.phases.reduce((total, phase) => {
      if (phase.status === PHASE_STATUS.COMPLETED || phase.status === PHASE_STATUS.SKIPPED) {
        const phaseData = PROJECT_PHASES.find(p => p.order === phase.order);
        return total + (phaseData?.widthPercent || 0);
      }
      return total;
    }, 0);
  };

  // Trigger confetti celebration
  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  // Fetch phases
  const fetchPhases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/phases`);

      if (response.status === 404) {
        // No roadmap exists, initialize it
        await initializePhases();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch phases');
      }

      const data = await response.json();
      setRoadmap(data.roadmap);
      setError(null);
    } catch (err) {
      console.error('Error fetching phases:', err);
      setError('Failed to load roadmap');
    } finally {
      setLoading(false);
    }
  };

  // Initialize phases
  const initializePhases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/phases/initialize`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to initialize phases');
      }

      const data = await response.json();
      setRoadmap(data.roadmap);
      setError(null);
    } catch (err) {
      console.error('Error initializing phases:', err);
      setError('Failed to initialize roadmap');
    } finally {
      setLoading(false);
    }
  };

  // Update phase status
  const updatePhaseStatus = async (phaseId: string, status: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/projects/${projectId}/phases/${phaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update phase');
      }

      const data = await response.json();

      // Update roadmap with new phase data
      if (roadmap) {
        const updatedPhases = roadmap.phases.map(p =>
          p.id === phaseId ? data.phase : p
        );
        setRoadmap({ ...roadmap, phases: updatedPhases });

        // Check if final phase (Approval - order 6) just completed
        const completedPhase = data.phase;
        if (completedPhase.order === 6 && status === PHASE_STATUS.COMPLETED) {
          triggerConfetti();
          setShowCelebration(true);
        }
      }

      // Close auto-advance toast if it was shown for this phase
      if (toastPhaseId === phaseId && status === PHASE_STATUS.COMPLETED) {
        setShowAutoAdvanceToast(false);
        setToastPhaseId(null);
      }

      onRefresh?.();
    } catch (err) {
      console.error('Error updating phase:', err);
      alert('Failed to update phase status');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchPhases();
  }, [projectId]);

  // Derive phases before any early returns so it can be used in useEffect
  const phases = roadmap?.phases || [];

  // Check for auto-advance opportunity when roadmap changes
  useEffect(() => {
    if (!roadmap || !phases || phases.length === 0) return;

    // Check if current in-progress phase has all requirements complete
    const inProgressPhase = phases.find(p => p.status === PHASE_STATUS.IN_PROGRESS);
    if (!inProgressPhase) return;

    const totalReqs = inProgressPhase.tasks?.length || 0;
    if (totalReqs === 0) return; // No requirements to check

    const completedReqs = inProgressPhase.tasks?.filter(
      t => t.status === 'DONE' || t.status === 'COMPLETE' || t.status === 'COMPLETED'
    ).length || 0;

    // All requirements complete - show toast
    if (completedReqs === totalReqs && !showAutoAdvanceToast && toastPhaseId !== inProgressPhase.id) {
      setToastPhaseId(inProgressPhase.id);
      setShowAutoAdvanceToast(true);
    }
  }, [roadmap, phases, showAutoAdvanceToast, toastPhaseId]);

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading roadmap...</p>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="w-full p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">{error || 'No roadmap available'}</p>
        <button
          onClick={initializePhases}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Initialize Roadmap
        </button>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress(phases);
  const completedCount = phases.filter(p => p.status === PHASE_STATUS.COMPLETED).length;
  const currentPhase = getCurrentPhase(phases);
  const estimatedCompletion = calculateEstimatedCompletion(phases, roadmap.createdAt ? new Date(roadmap.createdAt) : undefined);
  const daysInCurrentPhase = currentPhase ? getDaysInPhase(currentPhase) : null;
  const nextAction = getNextAction(phases);

  // Icon mapping
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Search,
    PenTool,
    Calculator,
    FolderOpen,
    Building2,
    Award,
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhaseId(expandedPhaseId === phaseId ? null : phaseId);
  };

  const renderActionButtons = (phase: RoadmapPhase) => {
    const buttons = [];

    // Check if phase is locked
    const previousPhase = phases.find(p => p.order === phase.order - 1);
    const isLocked = phase.order > 1 && previousPhase?.status !== PHASE_STATUS.COMPLETED && previousPhase?.status !== PHASE_STATUS.SKIPPED;

    if (phase.status === PHASE_STATUS.WAITING) {
      buttons.push(
        <button
          key="start"
          onClick={() => !isLocked && updatePhaseStatus(phase.id, PHASE_STATUS.IN_PROGRESS)}
          disabled={updating || isLocked}
          className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
            isLocked
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          title={isLocked ? `Complete ${previousPhase?.name} first` : ''}
        >
          {isLocked ? <Lock className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isLocked ? `🔒 Complete ${previousPhase?.name} first` : 'Start Phase'}
        </button>
      );
      buttons.push(
        <button
          key="skip"
          onClick={() => updatePhaseStatus(phase.id, PHASE_STATUS.SKIPPED)}
          disabled={updating}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Skip
        </button>
      );
    }

    if (phase.status === PHASE_STATUS.IN_PROGRESS) {
      buttons.push(
        <button
          key="complete"
          onClick={() => updatePhaseStatus(phase.id, PHASE_STATUS.COMPLETED)}
          disabled={updating}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          Complete
        </button>
      );
    }

    if (phase.status === PHASE_STATUS.COMPLETED || phase.status === PHASE_STATUS.SKIPPED) {
      buttons.push(
        <button
          key="reopen"
          onClick={() => updatePhaseStatus(phase.id, PHASE_STATUS.IN_PROGRESS)}
          disabled={updating}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          Reopen
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="w-full">
      {/* Pizza Tracker Container */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-blue-900 rounded-xl p-6 pb-12 shadow-2xl">
        {/* Header with title and progress % */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-white text-xl font-bold tracking-wide">PROJECT ROADMAP</h3>
            {estimatedCompletion && (
              <div className="text-gray-300 text-sm mt-1">
                Est. Completion: <span className="text-blue-300 font-semibold">{estimatedCompletion.toLocaleDateString()}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-green-400 text-3xl font-bold">{overallProgress}%</div>
            <div className="text-gray-300 text-xs tracking-wider">COMPLETE</div>
          </div>
        </div>

        {/* Progress Tracker Container */}
        <div className="relative py-12 mb-16 px-6 mt-10">
          {/* The "tube" background */}
          <div className="absolute top-1/2 left-6 right-6 h-3 bg-gray-600/80 rounded-full transform -translate-y-1/2 shadow-inner">
            {/* Green fill for completed portion - animated based on completed phase widths */}
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-700 ease-out shadow-lg"
              style={{ width: `${calculateCompletedPercent()}%` }}
            />
          </div>

          {/* Circles positioned on top based on variable widths */}
          <div className="relative">
            {phases.map((phase, index) => {
              const isExpanded = expandedPhaseId === phase.id;

              // Calculate CENTER position for this phase
              const phaseData = PROJECT_PHASES.find(p => p.order === phase.order);

              // Calculate cumulative start position (sum of all previous phases)
              const cumulativeStart = PROJECT_PHASES
                .filter(p => p.order < phase.order)
                .reduce((sum, p) => sum + p.widthPercent, 0);

              // Center position = start + (width / 2)
              const centerPosition = cumulativeStart + (phaseData ? phaseData.widthPercent / 2 : 0);

              // Get icon component
              const IconComponent = phaseData ? iconMap[phaseData.icon] : null;

              // Check if phase is locked (previous phase not complete)
              const previousPhase = phases.find(p => p.order === phase.order - 1);
              const isLocked = phase.order > 1 && previousPhase?.status !== PHASE_STATUS.COMPLETED && previousPhase?.status !== PHASE_STATUS.SKIPPED;

              // Count incomplete requirements
              const totalReqs = phase.tasks?.length || 0;
              const completedReqs = phase.tasks?.filter(t => t.status === 'DONE' || t.status === 'COMPLETE' || t.status === 'COMPLETED').length || 0;
              const incompleteReqs = totalReqs - completedReqs;

              // Calculate days in phase
              const phasedays = getDaysInPhase(phase);

              return (
                <div
                  key={phase.id}
                  className="relative group flex flex-col items-center"
                  style={{
                    position: 'absolute',
                    left: `${centerPosition}%`,
                    transform: 'translateX(-50%)',
                    top: '-28px'
                  }}
                >
                  {/* Circle */}
                  <button
                    onClick={() => togglePhase(phase.id)}
                    className={`
                      w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold
                      border-4 transition-all duration-300 z-10 shadow-lg hover:scale-110 relative
                      ${phase.status === PHASE_STATUS.COMPLETED ? 'bg-green-500 border-white text-white' : ''}
                      ${phase.status === PHASE_STATUS.IN_PROGRESS ? 'bg-blue-500 border-white text-white animate-gentle-glow' : ''}
                      ${phase.status === PHASE_STATUS.WAITING ? 'bg-gray-600 border-gray-500 text-gray-300' : ''}
                      ${phase.status === PHASE_STATUS.SKIPPED ? 'bg-orange-500 border-orange-300 text-white opacity-75' : ''}
                      ${isExpanded ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-slate-900' : ''}
                      ${isLocked ? 'opacity-60' : ''}
                    `}
                  >
                    {phase.status === PHASE_STATUS.COMPLETED ? (
                      <Check className="w-7 h-7" />
                    ) : phase.status === PHASE_STATUS.SKIPPED ? (
                      <X className="w-6 h-6" />
                    ) : isLocked ? (
                      <Lock className="w-5 h-5 text-gray-400" />
                    ) : IconComponent ? (
                      <IconComponent className="w-6 h-6" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </button>

                  {/* Red badge for incomplete requirements */}
                  {incompleteReqs > 0 && (phase.status === PHASE_STATUS.IN_PROGRESS || phase.status === PHASE_STATUS.WAITING) && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500
                                    rounded-full flex items-center justify-center
                                    text-white text-xs font-bold border-2 border-white z-20">
                      {incompleteReqs}
                    </div>
                  )}

                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                  bg-gray-900 text-white text-xs rounded-lg p-3 w-48 z-50
                                  pointer-events-none shadow-lg">
                    <div className="font-semibold mb-1">{phase.name}</div>
                    <div className="text-gray-300 capitalize">{phase.status.replace('_', ' ')}</div>
                    <div className="mt-2 space-y-1">
                      <div>📋 {completedReqs} of {totalReqs} requirements</div>
                      <div>⏱️ {phase.estimatedDuration}</div>
                      {phase.startDate && (
                        <div>📅 Started: {new Date(phase.startDate).toLocaleDateString()}</div>
                      )}
                      {phase.status === PHASE_STATUS.IN_PROGRESS && phasedays !== null && (
                        <div>📍 Day {phasedays}</div>
                      )}
                      {isLocked && (
                        <div className="mt-2 text-yellow-300">
                          🔒 Complete {previousPhase?.name} to unlock
                        </div>
                      )}
                    </div>
                    {/* Arrow pointing down */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2
                                    border-8 border-transparent border-t-gray-900" />
                  </div>

                  {/* Label below */}
                  <div className="mt-6 text-center max-w-[140px]">
                    <div className={`text-xs font-semibold leading-tight mb-1 ${
                      phase.status === PHASE_STATUS.COMPLETED ? 'text-green-300' :
                      phase.status === PHASE_STATUS.IN_PROGRESS ? 'text-blue-300' :
                      phase.status === PHASE_STATUS.SKIPPED ? 'text-orange-300' :
                      'text-gray-400'
                    }`}>
                      {phase.name}
                    </div>
                    <div className="text-gray-500 text-[10px]">{phase.estimatedDuration}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Banner */}
        {currentPhase && (
          <div className="bg-slate-700/50 rounded-lg backdrop-blur-sm border border-slate-600">
            <div className="text-center py-4 border-b border-slate-600">
              <span className="text-white font-bold text-sm tracking-wide">
                PHASE {currentPhase.order}: {currentPhase.name.toUpperCase()}
              </span>
              <span className="text-gray-300 ml-2 text-sm">
                - {currentPhase.description}
              </span>
            </div>

            {/* Days in Phase & Next Action */}
            <div className="px-4 py-3 flex justify-between items-center">
              {daysInCurrentPhase !== null && (
                <div className="text-sm">
                  <span className="text-gray-400">Days in phase: </span>
                  <span className={`font-bold ${
                    daysInCurrentPhase > 30 ? 'text-red-400' :
                    daysInCurrentPhase > 14 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {daysInCurrentPhase}
                  </span>
                </div>
              )}

              {nextAction && (
                <div className="text-sm">
                  <span className="text-gray-400">Next: </span>
                  <span className="text-blue-300 font-semibold">{nextAction}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Panel - Light background for contrast */}
      {expandedPhaseId && (
        <div className="mt-4 bg-white rounded-lg border-2 border-gray-300 p-6 shadow-xl">
          {phases
            .filter(p => p.id === expandedPhaseId)
            .map(phase => {
              return (
                <div key={phase.id}>
                  {/* Phase Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          phase.status === PHASE_STATUS.COMPLETED ? 'bg-green-500 border-green-600 text-white' :
                          phase.status === PHASE_STATUS.IN_PROGRESS ? 'bg-blue-500 border-blue-600 text-white' :
                          phase.status === PHASE_STATUS.SKIPPED ? 'bg-orange-500 border-orange-600 text-white' :
                          'bg-gray-500 border-gray-600 text-white'
                        }`}>
                          {phase.status === PHASE_STATUS.COMPLETED ? <Check className="w-5 h-5" /> : phase.order}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{phase.name}</h3>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          phase.status === PHASE_STATUS.COMPLETED ? 'bg-green-100 text-green-800' :
                          phase.status === PHASE_STATUS.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                          phase.status === PHASE_STATUS.SKIPPED ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {phase.status.toUpperCase().replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{phase.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Estimated Duration: {phase.estimatedDuration}
                      </p>
                    </div>
                  </div>

                  {/* Requirements List */}
                  {phase.tasks && phase.tasks.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Requirements ({phase.completedTaskCount || 0}/{phase.taskCount || 0} completed)
                      </h4>
                      <div className="space-y-2">
                        {phase.tasks.map(task => (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <input
                              type="checkbox"
                              checked={task.status === 'DONE' || task.status === 'COMPLETE'}
                              readOnly
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-gray-900">{task.title}</span>
                                {task.vendor && (
                                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    👤 {task.vendor.name}
                                    {task.vendor.company && ` (${task.vendor.company})`}
                                  </span>
                                )}
                              </div>
                              {task.vendor && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {task.vendor.trade}
                                </div>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                              task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                              task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!phase.tasks || phase.tasks.length === 0) && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
                      No requirements assigned to this phase yet
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-semibold text-gray-700">Phase Progress</span>
                      <span className="text-blue-600 font-bold">{phase.taskProgress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${phase.taskProgress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  {(phase.startDate || phase.endDate) && (
                    <div className="mb-6 flex gap-4 text-sm">
                      {phase.startDate && (
                        <div>
                          <span className="text-gray-600">Started: </span>
                          <span className="font-semibold text-gray-900">
                            {new Date(phase.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {phase.endDate && (
                        <div>
                          <span className="text-gray-600">Completed: </span>
                          <span className="font-semibold text-gray-900">
                            {new Date(phase.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {renderActionButtons(phase)}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Auto-Advance Toast */}
      {showAutoAdvanceToast && toastPhaseId && (
        <div className="fixed bottom-8 right-8 bg-white rounded-lg shadow-2xl border-2 border-green-500 p-6 max-w-md z-50 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-1">All Requirements Complete!</h4>
              <p className="text-sm text-gray-600 mb-4">
                You've completed all requirements for {phases.find(p => p.id === toastPhaseId)?.name}.
                Ready to mark this phase as complete?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    updatePhaseStatus(toastPhaseId, PHASE_STATUS.COMPLETED);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => {
                    setShowAutoAdvanceToast(false);
                    setToastPhaseId(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Not Yet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-2xl animate-bounce-in">
            <div className="mb-4">
              <Award className="w-20 h-20 text-yellow-500 mx-auto" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Project Complete!</h2>
            <p className="text-gray-600 mb-6">
              Congratulations! You've successfully completed all phases of your project roadmap.
            </p>
            <button
              onClick={() => setShowCelebration(false)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
