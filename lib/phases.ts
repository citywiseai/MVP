// Project Phase Constants and Types

export const PROJECT_PHASES = [
  {
    order: 1,
    name: "Discovery",
    duration: "2-4 weeks",
    avgDays: 21,
    widthPercent: 14,
    icon: "Search",
    description: "Initial site assessment and data collection"
  },
  {
    order: 2,
    name: "Design",
    duration: "3-6 weeks",
    avgDays: 31,
    widthPercent: 18,
    icon: "PenTool",
    description: "Architectural design and preliminary plans"
  },
  {
    order: 3,
    name: "Engineering",
    duration: "4-6 weeks",
    avgDays: 35,
    widthPercent: 20,
    icon: "Calculator",
    description: "Engineering calculations and compliance verification"
  },
  {
    order: 4,
    name: "Permit Submission",
    duration: "1-2 weeks",
    avgDays: 10,
    widthPercent: 10,
    icon: "FolderOpen",
    description: "Compile and submit permit application package"
  },
  {
    order: 5,
    name: "City Review",
    duration: "4-12 weeks",
    avgDays: 56,
    widthPercent: 28,
    icon: "Building2",
    description: "City plan check and review process"
  },
  {
    order: 6,
    name: "Approval",
    duration: "1-2 weeks",
    avgDays: 10,
    widthPercent: 10,
    icon: "Award",
    description: "Permit approved and ready for construction"
  },
] as const;

export const PHASE_STATUS = {
  WAITING: "waiting",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SKIPPED: "skipped",
} as const;

export type PhaseStatus = typeof PHASE_STATUS[keyof typeof PHASE_STATUS];

// Helper functions
export function getPhaseByOrder(order: number) {
  return PROJECT_PHASES.find(p => p.order === order);
}

export function getNextPhase(currentOrder: number) {
  return PROJECT_PHASES.find(p => p.order === currentOrder + 1);
}

export function getPreviousPhase(currentOrder: number) {
  return PROJECT_PHASES.find(p => p.order === currentOrder - 1);
}

export function isPhaseComplete(status: string): boolean {
  return status === PHASE_STATUS.COMPLETED;
}

export function canStartPhase(currentPhase: number, phases: any[]): boolean {
  // Can start phase 1 anytime
  if (currentPhase === 1) return true;

  // For other phases, previous phase must be completed or skipped
  const previousPhase = phases.find(p => p.order === currentPhase - 1);
  if (!previousPhase) return false;

  return previousPhase.status === PHASE_STATUS.COMPLETED ||
         previousPhase.status === PHASE_STATUS.SKIPPED;
}

export function calculateOverallProgress(phases: any[]): number {
  if (!phases || phases.length === 0) return 0;

  const completedPhases = phases.filter(p =>
    p.status === PHASE_STATUS.COMPLETED
  ).length;

  return Math.round((completedPhases / phases.length) * 100);
}

export function getCurrentPhase(phases: any[]): any | null {
  // Return the first in_progress phase
  const inProgress = phases.find(p => p.status === PHASE_STATUS.IN_PROGRESS);
  if (inProgress) return inProgress;

  // If none in progress, return the first waiting phase
  const waiting = phases.find(p => p.status === PHASE_STATUS.WAITING);
  if (waiting) return waiting;

  // All completed or skipped
  return null;
}

// Status colors for UI
export const PHASE_COLORS = {
  [PHASE_STATUS.WAITING]: {
    bg: "bg-gray-100",
    border: "border-gray-300",
    text: "text-gray-700",
    badge: "bg-gray-200 text-gray-700"
  },
  [PHASE_STATUS.IN_PROGRESS]: {
    bg: "bg-blue-50",
    border: "border-blue-500",
    text: "text-blue-900",
    badge: "bg-blue-500 text-white"
  },
  [PHASE_STATUS.COMPLETED]: {
    bg: "bg-green-50",
    border: "border-green-500",
    text: "text-green-900",
    badge: "bg-green-500 text-white"
  },
  [PHASE_STATUS.SKIPPED]: {
    bg: "bg-orange-50",
    border: "border-orange-400",
    text: "text-orange-900",
    badge: "bg-orange-400 text-white opacity-75"
  },
} as const;

// Task keyword mapping for auto-assignment
export const TASK_PHASE_KEYWORDS = {
  1: ['survey', 'topographic', 'site assessment', 'soil', 'discovery', 'research', 'zoning verification', 'site analysis', 'due diligence'],
  2: ['design', 'floor plan', 'architectural', 'rendering', '3d', 'schematic', 'preliminary', 'concept', 'layout'],
  3: ['structural', 'electrical', 'energy code', 'rescheck', 'comcheck', 'mechanical', 'plumbing', 'engineering', 'calculations', 'title 24', 'mep', 'hvac', 'civil'],
  4: ['permit package', 'application', 'document assembly', 'fee', 'compilation', 'submittal', 'package prep', 'permit submission', 'submit'],
  5: ['city review', 'plan check', 'corrections', 'resubmittal', 'submission', 'review', 'municipal', 'revisions'],
  6: ['permit issuance', 'approval', 'pickup', 'inspection', 'final approval', 'authorization', 'approved', 'final'],
} as const;

// Suggest phase for a task based on title keywords
export function suggestPhaseForTask(taskTitle: string): number | null {
  const title = taskTitle.toLowerCase();

  for (const [phaseStr, keywords] of Object.entries(TASK_PHASE_KEYWORDS)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return parseInt(phaseStr);
    }
  }

  return null;
}

// Calculate estimated completion date
export function calculateEstimatedCompletion(phases: any[], projectStartDate?: Date): Date | null {
  const start = projectStartDate || new Date();
  let totalDays = 0;

  for (const phase of phases) {
    const phaseData = PROJECT_PHASES.find(p => p.order === phase.order);
    if (phaseData) {
      if (phase.status === PHASE_STATUS.COMPLETED) {
        // Use actual duration if completed
        if (phase.startDate && phase.endDate) {
          const actual = Math.ceil((new Date(phase.endDate).getTime() - new Date(phase.startDate).getTime()) / (1000 * 60 * 60 * 24));
          totalDays += actual;
        } else {
          totalDays += phaseData.avgDays;
        }
      } else {
        // Use average duration for incomplete phases
        totalDays += phaseData.avgDays;
      }
    }
  }

  const estimatedDate = new Date(start);
  estimatedDate.setDate(estimatedDate.getDate() + totalDays);
  return estimatedDate;
}

// Calculate days in current phase
export function getDaysInPhase(phase: any): number | null {
  if (!phase.startDate) return null;

  const start = new Date(phase.startDate);
  const end = phase.endDate ? new Date(phase.endDate) : new Date();
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return days;
}

// Get next incomplete task in current phase
export function getNextAction(phases: any[]): string | null {
  const currentPhase = getCurrentPhase(phases);
  if (!currentPhase) return null;

  // Find first incomplete task
  const incompleteTasks = currentPhase.tasks?.filter(
    (t: any) => t.status !== 'DONE' && t.status !== 'COMPLETE'
  );

  if (incompleteTasks && incompleteTasks.length > 0) {
    return `Complete "${incompleteTasks[0].title}" to advance`;
  }

  // No tasks or all complete
  if (currentPhase.status === PHASE_STATUS.IN_PROGRESS) {
    return `Mark ${currentPhase.name} complete`;
  }

  return `Start ${currentPhase.name}`;
}
