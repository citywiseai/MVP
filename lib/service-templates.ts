import { RezioService } from '@/types/roadmap';

export const REZIO_SERVICES: Record<string, RezioService> = {
  TITLE_REPORT: {
    id: 'title_report',
    name: 'Title Report',
    category: 'Discovery',
    estimatedWeeks: { min: 1, max: 2 },
    complexity: 'simple',
    description: 'Property ownership and lien verification'
  },

  SURVEY: {
    id: 'survey',
    name: 'Boundary Survey',
    category: 'Discovery',
    estimatedWeeks: { min: 2, max: 3 },
    complexity: 'medium',
    description: 'Professional property boundary survey'
  },

  ARCHITECTURAL_DESIGN: {
    id: 'architectural_design',
    name: 'Architectural Design',
    category: 'Design',
    estimatedWeeks: { min: 3, max: 6 },
    complexity: 'complex',
    description: 'Complete architectural plans and elevations'
  },

  STRUCTURAL_ENGINEERING: {
    id: 'structural_engineering',
    name: 'Structural Engineering',
    category: 'Engineering',
    estimatedWeeks: { min: 2, max: 4 },
    complexity: 'complex',
    description: 'Structural calculations and stamped plans'
  },

  MEP_ENGINEERING: {
    id: 'mep_engineering',
    name: 'MEP Engineering',
    category: 'Engineering',
    estimatedWeeks: { min: 2, max: 3 },
    complexity: 'medium',
    description: 'Mechanical, Electrical, Plumbing engineering'
  },

  CIVIL_ENGINEERING: {
    id: 'civil_engineering',
    name: 'Civil Engineering',
    category: 'Engineering',
    estimatedWeeks: { min: 2, max: 4 },
    complexity: 'complex',
    description: 'Grading, drainage, and utility plans'
  },

  ENERGY_CALC: {
    id: 'energy_calc',
    name: 'Energy Calculations',
    category: 'Compliance',
    estimatedWeeks: { min: 1, max: 2 },
    complexity: 'simple',
    description: 'Title 24 energy compliance calculations'
  },

  PERMIT_PACKAGE: {
    id: 'permit_package',
    name: 'Permit Package Assembly',
    category: 'Permit Prep',
    estimatedWeeks: { min: 1, max: 1 },
    complexity: 'simple',
    description: 'Final permit package compilation and review'
  },
};

export const PROJECT_TYPE_SERVICES: Record<string, string[]> = {
  'ADU': [
    'TITLE_REPORT',
    'SURVEY',
    'ARCHITECTURAL_DESIGN',
    'STRUCTURAL_ENGINEERING',
    'MEP_ENGINEERING',
    'CIVIL_ENGINEERING',
    'ENERGY_CALC',
    'PERMIT_PACKAGE'
  ],
  'ADDITION': [
    'TITLE_REPORT',
    'SURVEY',
    'ARCHITECTURAL_DESIGN',
    'STRUCTURAL_ENGINEERING',
    'MEP_ENGINEERING',
    'ENERGY_CALC',
    'PERMIT_PACKAGE'
  ],
  'POOL': [
    'SURVEY',
    'ARCHITECTURAL_DESIGN',
    'STRUCTURAL_ENGINEERING',
    'CIVIL_ENGINEERING',
    'PERMIT_PACKAGE'
  ],
  'SOLAR': [
    'STRUCTURAL_ENGINEERING',
    'MEP_ENGINEERING',
    'ENERGY_CALC',
    'PERMIT_PACKAGE'
  ]
};
