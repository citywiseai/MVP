export type PhaseStatus = 'waiting' | 'in_progress' | 'completed' | 'skipped';

export type PhaseName =
  | 'Discovery & Site Analysis'
  | 'Design & Planning'
  | 'Design Planning'
  | 'Engineering & Compliance'
  | 'Engineering Compliance'
  | 'Permit Package Preparation'
  | 'City Review'
  | 'Permit Issuance';

export interface RezioService {
  id: string;
  name: string;
  category: string;
  estimatedWeeks: {
    min: number;
    max: number;
  };
  complexity: 'simple' | 'medium' | 'complex';
  description: string;
}

export interface PhaseTask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

export interface RoadmapPhase {
  id: string;
  name: string;
  order: number;
  status: PhaseStatus;
  estimatedDuration: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  services: RezioService[];
  progress: number;
  description?: string;
  dependencies: string[];
  tasks?: PhaseTask[];
  taskCount?: number;
  completedTaskCount?: number;
  taskProgress?: number;
}

export interface ProjectRoadmap {
  id: string;
  projectId: string;
  phases: RoadmapPhase[];
  createdAt: Date;
  updatedAt: Date;
}
