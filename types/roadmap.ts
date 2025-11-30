export type PhaseStatus = 'waiting' | 'in_progress' | 'completed';

export type PhaseName =
  | 'Discovery & Site Analysis'
  | 'Design & Planning'
  | 'Engineering & Compliance'
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

export interface RoadmapPhase {
  id: string;
  name: PhaseName;
  order: number;
  status: PhaseStatus;
  estimatedDuration: string;
  startDate?: Date;
  endDate?: Date;
  services: RezioService[];
  progress: number;
  description?: string;
  dependencies: string[];
}

export interface ProjectRoadmap {
  id: string;
  projectId: string;
  phases: RoadmapPhase[];
  createdAt: Date;
  updatedAt: Date;
}
