import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createDefaultRoadmap(projectId: string) {
  console.log('🔍 Generating roadmap for project:', projectId);

  // Get existing tasks for this project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { tasks: true }
  });

  const tasks = project?.tasks || [];
  console.log('📋 Found existing tasks:', tasks.length, tasks.map(t => t.title));

  const defaultRoadmap = {
    phases: [
      {
        id: 'discovery',
        name: 'Discovery & Site Analysis',
        description: 'Gathering essential property information',
        status: 'in_progress',
        estimatedDuration: '1-2 weeks',
        services: [
          { name: 'Title Report', status: 'pending' },
          { name: 'Topographic Survey', status: 'pending' },
          { name: 'Soils Investigation', status: 'pending' }
        ],
        dependencies: []
      },
      {
        id: 'design',
        name: 'Design & Client Review',
        description: 'Creating and refining your project vision',
        status: 'not_started',
        estimatedDuration: '3-4 weeks',
        services: [
          { name: 'Architectural Plans', status: 'pending' },
          { name: 'Floor Plans', status: 'pending' },
          { name: 'Elevations', status: 'pending' }
        ],
        dependencies: ['discovery']
      },
      {
        id: 'engineering',
        name: 'Engineering & Technical Design',
        description: 'Structural, MEP, and civil engineering work',
        status: 'not_started',
        estimatedDuration: '2-3 weeks',
        services: [
          { name: 'Structural Plans', status: 'pending' },
          { name: 'Electrical Plans', status: 'pending' },
          { name: 'MEP Plans', status: 'pending' }
        ],
        dependencies: ['design']
      },
      {
        id: 'permit_package',
        name: 'Permit Package Preparation',
        description: 'Compiling all documents for submission',
        status: 'not_started',
        estimatedDuration: '1 week',
        services: [
          { name: 'Compile Documents', status: 'pending' },
          { name: 'Application Forms', status: 'pending' }
        ],
        dependencies: ['engineering']
      },
      {
        id: 'city_review',
        name: 'City Review & Approval',
        description: 'Working with jurisdiction to obtain permits',
        status: 'not_started',
        estimatedDuration: '3-6 weeks',
        services: [
          { name: 'Submit to City', status: 'pending' },
          { name: 'Respond to Comments', status: 'pending' }
        ],
        dependencies: ['permit_package']
      },
      {
        id: 'permit_issuance',
        name: 'Permit Issuance',
        description: 'Receiving your construction permits',
        status: 'not_started',
        estimatedDuration: '1-2 days',
        services: [
          { name: 'Pick Up Permits', status: 'pending' },
          { name: 'Distribute to Team', status: 'pending' }
        ],
        dependencies: ['city_review']
      }
    ],
    currentPhaseId: 'discovery',
    overallProgress: 0
  };

  // Calculate estimated completion date (12 weeks from now)
  const estimatedCompletionDate = new Date();
  estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + (12 * 7));

  const roadmap = await prisma.projectRoadmap.create({
    data: {
      projectId,
      phases: defaultRoadmap.phases,
      currentPhaseId: defaultRoadmap.currentPhaseId,
      overallProgress: defaultRoadmap.overallProgress,
      estimatedCompletionDate
    }
  });

  return roadmap;
}
