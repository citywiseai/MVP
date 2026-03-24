export const PHASE_KEYWORDS = {
  discovery: [
    'survey', 'topographic', 'topo', 'title', 'site analysis',
    'soils', 'investigation', 'geotechnical', 'boundary', 'utility locate',
    'blue stake', 'property report', 'zoning analysis', 'feasibility'
  ],
  design: [
    'design', 'architectural', 'floor plan', 'elevation', 'rendering',
    'concept', 'layout', 'space planning', 'interior design', 'exterior design',
    'schematic', 'preliminary design', 'design development'
  ],
  engineering: [
    'structural', 'electrical', 'mep', 'mechanical', 'plumbing', 'engineering',
    'hvac', 'foundation', 'beam', 'column', 'load', 'calculations',
    'civil', 'grading', 'drainage', 'fire protection', 'sprinkler'
  ],
  permit_package: [
    'permit package', 'compilation', 'submittal prep', 'application',
    'permit forms', 'package preparation', 'document compilation'
  ],
  city_review: [
    'city review', 'plan check', 'comments', 'revisions', 'resubmittal',
    'correction', 'r2', 'review comments', 'jurisdiction review'
  ],
  permit_issuance: [
    'permit issuance', 'final approval', 'stamped plans', 'permit pickup',
    'approved plans', 'building permit', 'permit ready'
  ]
};

export function detectPhaseFromTitle(title: string): string | null {
  const lowerTitle = title.toLowerCase();

  for (const [phaseKey, keywords] of Object.entries(PHASE_KEYWORDS)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return phaseKey;
    }
  }

  return null;
}

export function detectDocumentType(filename: string): string {
  const lower = filename.toLowerCase();

  if (/(structural|foundation|beam|column|framing)/i.test(lower)) return 'STRUCTURAL_PLANS';
  if (/(electrical|lighting|panel|power)/i.test(lower)) return 'ELECTRICAL_PLANS';
  if (/(mechanical|hvac|ventilation)/i.test(lower)) return 'MECHANICAL_PLANS';
  if (/(plumbing|water|sewer|gas)/i.test(lower)) return 'PLUMBING_PLANS';
  if (/(architectural|floor plan|elevation|section)/i.test(lower)) return 'ARCHITECTURAL_DRAWINGS';
  if (/(site plan|site layout|grading|landscape)/i.test(lower)) return 'SITE_PLAN';
  if (/(survey|topo|boundary)/i.test(lower)) return 'SURVEY';
  if (/(soils|geotechnical|boring)/i.test(lower)) return 'SOILS_REPORT';
  if (/(title|deed|ownership)/i.test(lower)) return 'TITLE_REPORT';
  if (/(permit|application|submittal)/i.test(lower)) return 'PERMIT_APPLICATION';
  if (/(inspection|report)/i.test(lower)) return 'INSPECTION_REPORT';
  if (/(email|letter|correspondence)/i.test(lower)) return 'CORRESPONDENCE';
  if (/\.(jpg|jpeg|png|gif|heic)/i.test(lower)) return 'PHOTO';

  return 'OTHER';
}
