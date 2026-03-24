export interface ChecklistItem {
  name: string;
  description: string;
  condition?: string;
}

export interface DocumentChecklist {
  required: ChecklistItem[];
  conditional: ChecklistItem[];
  atCompletion: ChecklistItem[];
}

export const DOCUMENT_CHECKLISTS: Record<string, DocumentChecklist> = {
  ADDITION: {
    required: [
      { name: 'Site Plan', description: 'Show existing structure, proposed addition, setbacks, and lot coverage calculations' },
      { name: 'Floor Plans', description: 'Existing and proposed layouts with dimensions and room labels' },
      { name: 'Elevations', description: 'All affected building sides showing existing and proposed' },
      { name: 'Structural Plans', description: 'Foundation, framing, and connection details (sealed by engineer)' },
      { name: 'Electrical Plans', description: 'New circuits, panel capacity, lighting layout' },
      { name: 'Energy Calculations', description: 'REScheck or COMcheck compliance documentation' },
    ],
    conditional: [
      { name: 'Soils/Geotechnical Report', description: 'Foundation soil bearing analysis', condition: 'If foundation work required or hillside' },
      { name: 'Survey', description: 'Boundary and topographic survey', condition: 'If near property lines or easements' },
      { name: 'HOA Approval Letter', description: 'Architectural review committee approval', condition: 'If in HOA community' },
      { name: 'Grading/Drainage Plan', description: 'Site drainage modifications', condition: 'If changing lot grades or drainage' },
      { name: 'Truss Engineering', description: 'Prefabricated truss specifications', condition: 'If using manufactured trusses' },
    ],
    atCompletion: [
      { name: 'As-Built Drawings', description: 'Final drawings showing actual construction' },
      { name: 'Inspection Records', description: 'All passed inspection sign-offs' },
      { name: 'Warranty Documents', description: 'Equipment and material warranties' },
      { name: 'Certificate of Occupancy', description: 'Final approval from building department' },
    ],
  },
  ADU: {
    required: [
      { name: 'Site Plan', description: 'Show main dwelling, ADU location, setbacks, parking, and access' },
      { name: 'Floor Plans', description: 'Complete ADU layout with dimensions' },
      { name: 'Elevations', description: 'All four sides of ADU' },
      { name: 'Structural Plans', description: 'Foundation and framing (sealed)' },
      { name: 'Electrical Plans', description: 'Panel, circuits, and lighting layout' },
      { name: 'Plumbing Plans', description: 'Water supply and sewer/septic connection' },
      { name: 'Mechanical Plans', description: 'HVAC equipment and ductwork' },
      { name: 'Energy Calculations', description: 'REScheck compliance for ADU' },
    ],
    conditional: [
      { name: 'Soils Report', description: 'Geotechnical investigation', condition: 'If new foundation required' },
      { name: 'Utility Capacity Letter', description: 'Water/sewer availability confirmation', condition: 'If separate meters required' },
      { name: 'Fire Sprinkler Plans', description: 'Sprinkler layout and calculations', condition: 'If ADU over 500 sq ft in some jurisdictions' },
      { name: 'HOA Approval', description: 'Community approval letter', condition: 'If in HOA community' },
      { name: 'Owner Occupancy Covenant', description: 'Recorded deed restriction', condition: 'If required by jurisdiction' },
    ],
    atCompletion: [
      { name: 'As-Built Drawings', description: 'Final drawings reflecting actual construction' },
      { name: 'Inspection Records', description: 'All passed inspections' },
      { name: 'Address Assignment', description: 'Official address for ADU' },
      { name: 'Utility Account Setup', description: 'Separate meters if applicable' },
    ],
  },
  NEW_CONSTRUCTION: {
    required: [
      { name: 'Site Plan', description: 'Complete lot layout with structure, setbacks, utilities, and grading' },
      { name: 'Foundation Plan', description: 'Foundation layout with footing details' },
      { name: 'Floor Plans', description: 'All levels with dimensions and room labels' },
      { name: 'Roof Plan', description: 'Roof layout, slopes, and drainage' },
      { name: 'Elevations', description: 'All four building sides' },
      { name: 'Building Sections', description: 'Cross-sections showing construction details' },
      { name: 'Structural Plans', description: 'Complete structural package (sealed)' },
      { name: 'Electrical Plans', description: 'Full electrical layout and panel schedule' },
      { name: 'Plumbing Plans', description: 'Water supply, DWV, and fixture layout' },
      { name: 'Mechanical Plans', description: 'HVAC design and duct layout' },
      { name: 'Energy Calculations', description: 'Full energy code compliance package' },
      { name: 'Grading Plan', description: 'Site drainage and elevation changes' },
    ],
    conditional: [
      { name: 'Soils Report', description: 'Geotechnical investigation', condition: 'Required for all new construction' },
      { name: 'Survey', description: 'ALTA or boundary survey', condition: 'Required for all new construction' },
      { name: 'Landscape Plan', description: 'Required plantings and irrigation', condition: 'If required by jurisdiction' },
      { name: 'Pool Plans', description: 'Pool/spa construction documents', condition: 'If pool included' },
      { name: 'Solar Plans', description: 'PV system design', condition: 'If solar included or required' },
      { name: 'HOA Approval', description: 'Architectural approval', condition: 'If in HOA community' },
    ],
    atCompletion: [
      { name: 'As-Built Drawings', description: 'Complete as-built package' },
      { name: 'All Inspection Records', description: 'Foundation, framing, electrical, plumbing, mechanical, final' },
      { name: 'Certificate of Occupancy', description: 'Final building department approval' },
      { name: 'Warranty Package', description: 'All equipment and material warranties' },
      { name: 'Utility Connections', description: 'Final utility account transfers' },
    ],
  },
  REMODEL: {
    required: [
      { name: 'Floor Plans', description: 'Existing and proposed layouts' },
      { name: 'Scope of Work', description: 'Written description of all work' },
    ],
    conditional: [
      { name: 'Structural Plans', description: 'If removing/modifying walls or structure', condition: 'If structural changes' },
      { name: 'Electrical Plans', description: 'If adding circuits or upgrading panel', condition: 'If electrical work' },
      { name: 'Plumbing Plans', description: 'If relocating fixtures or adding bathroom', condition: 'If plumbing work' },
      { name: 'Mechanical Plans', description: 'If modifying HVAC system', condition: 'If HVAC changes' },
      { name: 'Elevations', description: 'If changing exterior appearance', condition: 'If exterior changes' },
      { name: 'HOA Approval', description: 'If exterior visible changes', condition: 'If in HOA with exterior work' },
    ],
    atCompletion: [
      { name: 'As-Built Drawings', description: 'If significant changes from approved plans' },
      { name: 'Inspection Records', description: 'All required inspection sign-offs' },
      { name: 'Final Approval', description: 'Permit finalization' },
    ],
  },
};

export function getChecklist(projectType: string): DocumentChecklist | null {
  const type = projectType?.toUpperCase().replace(/[^A-Z_]/g, '_');
  return DOCUMENT_CHECKLISTS[type] || DOCUMENT_CHECKLISTS['ADDITION'];
}
