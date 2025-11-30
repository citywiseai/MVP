import { RoadmapPhase, PhaseName } from '@/types/roadmap';
import { REZIO_SERVICES, PROJECT_TYPE_SERVICES } from './service-templates';

export function generateRoadmap(
  projectType: string,
  complexity: 'simple' | 'medium' | 'complex' = 'medium'
): Omit<RoadmapPhase, 'id' | 'roadmapId'>[] {
  const serviceIds = PROJECT_TYPE_SERVICES[projectType.toUpperCase()] || PROJECT_TYPE_SERVICES['ADU'];
  const services = serviceIds.map(id => REZIO_SERVICES[id]).filter(Boolean);

  // Define 6 phases
  const phases: Omit<RoadmapPhase, 'id' | 'roadmapId'>[] = [
    {
      name: 'Discovery & Site Analysis',
      order: 1,
      status: 'in_progress',
      estimatedDuration: '2-4 weeks',
      services: services.filter(s => s.category === 'Discovery'),
      progress: 0,
      description: 'Initial site assessment and data collection',
      dependencies: []
    },
    {
      name: 'Design & Planning',
      order: 2,
      status: 'waiting',
      estimatedDuration: '3-6 weeks',
      services: services.filter(s => s.category === 'Design'),
      progress: 0,
      description: 'Architectural design and preliminary plans',
      dependencies: []
    },
    {
      name: 'Engineering & Compliance',
      order: 3,
      status: 'waiting',
      estimatedDuration: '4-6 weeks',
      services: services.filter(s => s.category === 'Engineering' || s.category === 'Compliance'),
      progress: 0,
      description: 'Engineering calculations and compliance verification',
      dependencies: []
    },
    {
      name: 'Permit Package Preparation',
      order: 4,
      status: 'waiting',
      estimatedDuration: '1-2 weeks',
      services: services.filter(s => s.category === 'Permit Prep'),
      progress: 0,
      description: 'Final document assembly and submission prep',
      dependencies: []
    },
    {
      name: 'City Review',
      order: 5,
      status: 'waiting',
      estimatedDuration: '4-12 weeks',
      services: [],
      progress: 0,
      description: 'Municipal plan check and corrections',
      dependencies: []
    },
    {
      name: 'Permit Issuance',
      order: 6,
      status: 'waiting',
      estimatedDuration: '1-2 weeks',
      services: [],
      progress: 0,
      description: 'Final approval and permit pickup',
      dependencies: []
    }
  ];

  return phases;
}
