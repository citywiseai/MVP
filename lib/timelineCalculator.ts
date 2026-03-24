interface PhaseTimeline {
  id: string;
  name: string;
  order: number;
  estimatedDays: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
}

interface TimelineResult {
  phases: PhaseTimeline[];
  totalDays: number;
  estimatedCompletion: Date;
  criticalPath: string[];
}

// Add business days to a date (skip weekends)
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }

  return result;
}

// Calculate business days between two dates
export function getBusinessDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);

  while (current < end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

// Default phase durations (business days)
export const DEFAULT_PHASE_DURATIONS: Record<string, number> = {
  'Discovery': 15,      // 3 weeks
  'Design': 20,         // 4 weeks
  'Engineering': 25,    // 5 weeks
  'Permit Submission': 5, // 1 week
  'City Review': 40,    // 8 weeks (varies by jurisdiction)
  'Approval': 5,        // 1 week
};

// Get City Review duration based on jurisdiction and permit type
export function getCityReviewDuration(
  jurisdiction: string,
  permitType: string,
  permitTimelines: any[]
): number {
  const timeline = permitTimelines.find(
    t => t.jurisdiction === jurisdiction.toLowerCase() && t.permitType === permitType
  );

  if (timeline) {
    return timeline.planReviewDays +
      (timeline.revisionDays * timeline.typicalRevisions) +
      timeline.approvalDays;
  }

  return DEFAULT_PHASE_DURATIONS['City Review'];
}

// Calculate full project timeline
export function calculateProjectTimeline(
  phases: any[],
  startDate: Date = new Date(),
  vendorBids: any[] = [],
  permitTimeline: any = null
): TimelineResult {
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);
  const result: PhaseTimeline[] = [];
  let currentDate = new Date(startDate);
  let totalDays = 0;

  for (const phase of sortedPhases) {
    // Determine estimated days for this phase
    let estimatedDays = phase.estimatedDays || DEFAULT_PHASE_DURATIONS[phase.name] || 20;

    // If phase has tasks with accepted bids, use the longest bid timeline
    const phaseTasks = phase.tasks || [];
    const acceptedBids = phaseTasks
      .flatMap((t: any) => t.bids || [])
      .filter((b: any) => b.status === 'accepted' && b.estimatedCompletionDate);

    if (acceptedBids.length > 0) {
      // Find the bid with the furthest completion date
      const latestBid = acceptedBids.reduce((latest: any, bid: any) => {
        const bidDate = new Date(bid.estimatedCompletionDate);
        return !latest || bidDate > new Date(latest.estimatedCompletionDate) ? bid : latest;
      }, null);

      if (latestBid) {
        const bidDays = getBusinessDaysBetween(currentDate, new Date(latestBid.estimatedCompletionDate));
        estimatedDays = Math.max(estimatedDays, bidDays);
      }
    }

    // Special handling for City Review - use permit timeline data
    if (phase.name === 'City Review' && permitTimeline) {
      const permitDays = permitTimeline.planReviewDays +
        (permitTimeline.revisionDays * permitTimeline.typicalRevisions) +
        permitTimeline.approvalDays;
      estimatedDays = permitDays;
    }

    // Calculate dates
    const phaseStartDate = phase.status === 'complete' && phase.startDate
      ? new Date(phase.startDate)
      : new Date(currentDate);

    const phaseEndDate = phase.status === 'complete' && phase.endDate
      ? new Date(phase.endDate)
      : addBusinessDays(phaseStartDate, estimatedDays);

    result.push({
      id: phase.id,
      name: phase.name,
      order: phase.order,
      estimatedDays,
      startDate: phaseStartDate,
      endDate: phaseEndDate,
      status: phase.status,
    });

    totalDays += estimatedDays;
    currentDate = phaseEndDate;
  }

  return {
    phases: result,
    totalDays,
    estimatedCompletion: currentDate,
    criticalPath: result.map(p => p.name), // Simple: all phases are critical
  };
}

// Format duration for display
export function formatDuration(days: number): string {
  if (days < 5) return `${days} days`;
  const weeks = Math.ceil(days / 5);
  return `${weeks} week${weeks !== 1 ? 's' : ''}`;
}

// Format date for display
export function formatDate(date: Date | null): string {
  if (!date) return 'TBD';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
