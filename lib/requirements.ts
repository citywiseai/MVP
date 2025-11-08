// Requirement generation based on project type and jurisdiction

export type ProjectType = 'ADDITION' | 'REMODEL' | 'ADU' | 'NEW_CONSTRUCTION' | 'DEMOLITION' | 'GARAGE_CONVERSION' | 'PATIO_COVER' | 'FENCE' | 'POOL' | 'SOLAR';

export interface ProjectDetails {
  projectType: ProjectType;
  jurisdiction: string;
  squareFootage?: number;
  structuralChanges?: boolean;
  plumbingWork?: boolean;
  electricalWork?: boolean;
  electricalServiceAmps?: number;
  lotSize?: number;
}

export interface Requirement {
  name: string;
  description: string;
  type: 'structural' | 'civil' | 'electrical' | 'mechanical' | 'plumbing' | 'general';
}

export function parseProjectDataToDetails(projectData: any): ProjectDetails {
  const conversation = projectData.conversation || '';
  const conversationLower = conversation.toLowerCase();
  
  // Extract square footage
  let squareFootage: number | undefined;
  const sqftMatch = conversationLower.match(/(\d+)-(\d+)\s*sq\s*ft/);
  if (sqftMatch) {
    squareFootage = parseInt(sqftMatch[2]); // Use upper bound
  } else {
    const exactMatch = conversationLower.match(/(\d+)\s*sq\s*ft/);
    if (exactMatch) {
      squareFootage = parseInt(exactMatch[1]);
    }
  }
  
  // Detect structural changes
  const structuralChanges = conversationLower.includes('moving') || 
                           conversationLower.includes('removing') || 
                           conversationLower.includes('structural');
  
  // Detect plumbing work
  const plumbingWork = conversationLower.includes('bathroom') || 
                      conversationLower.includes('kitchen') || 
                      conversationLower.includes('plumbing');
  
  // Detect electrical work
  const electricalWork = conversationLower.includes('panel upgrade') || 
                        conversationLower.includes('electrical') ||
                        conversationLower.includes('upgrading panel');
  
  return {
    projectType: projectData.projectType?.toUpperCase() as ProjectType,
    jurisdiction: 'Phoenix',
    squareFootage,
    structuralChanges,
    plumbingWork,
    electricalWork,
    electricalServiceAmps: electricalWork ? 200 : undefined,
    lotSize: projectData.lotSize,
  };
}

export async function getRequirementsForProject(details: ProjectDetails): Promise<Requirement[]> {
  const requirements: Requirement[] = [];

  // Always include survey for Phoenix projects
  requirements.push({
    name: 'Topographic Survey',
    description: 'Required boundary and topographic survey showing property lines, easements, and existing improvements',
    type: 'civil'
  });

  // Structural requirements
  if (details.structuralChanges || details.projectType === 'ADDITION' || details.projectType === 'ADU') {
    requirements.push({
      name: 'Structural Engineering Plans',
      description: 'Sealed structural plans for foundations, framing, and load-bearing elements',
      type: 'structural'
    });
    
    requirements.push({
      name: 'Soils Report',
      description: 'Geotechnical investigation for foundation design',
      type: 'civil'
    });
  }

  // Civil/site requirements
  if (details.projectType === 'NEW_CONSTRUCTION' || details.projectType === 'ADU') {
    requirements.push({
      name: 'Civil Engineering Plans',
      description: 'Site grading, drainage, and utility connection plans',
      type: 'civil'
    });
  }

  // Plumbing requirements
  if (details.plumbingWork) {
    requirements.push({
      name: 'Plumbing Plans',
      description: 'Water supply, drainage, and venting plans showing fixture locations and pipe sizing',
      type: 'plumbing'
    });
  }

  // Electrical requirements
  if (details.electricalWork) {
    requirements.push({
      name: 'Electrical Plans',
      description: 'Single-line diagram, panel schedule, and lighting/receptacle layout',
      type: 'electrical'
    });
    
    if (details.electricalServiceAmps && details.electricalServiceAmps >= 200) {
      requirements.push({
        name: 'Electrical Service Upgrade',
        description: 'Utility coordination for new 200A service entrance',
        type: 'electrical'
      });
    }
  }

  // HVAC requirements
  if (details.squareFootage && details.squareFootage > 200) {
    requirements.push({
      name: 'HVAC Plans',
      description: 'Heating, ventilation, and air conditioning system design with Manual J load calculations',
      type: 'mechanical'
    });
  }

  // Energy code compliance
  if (details.projectType === 'ADDITION' || details.projectType === 'ADU' || details.projectType === 'NEW_CONSTRUCTION') {
    requirements.push({
      name: 'Energy Code Compliance',
      description: 'REScheck or COMcheck analysis showing compliance with 2021 IECC',
      type: 'general'
    });
  }

  return requirements;
}
