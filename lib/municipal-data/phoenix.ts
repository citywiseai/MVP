// lib/municipal-data/phoenix.ts
// Phoenix, AZ Municipal Zoning Database
// Source: Phoenix Zoning Ordinance, City of Phoenix Planning & Development

export interface Setbacks {
  front: number;      // feet
  rear: number;       // feet
  side: number;       // feet
  streetSide?: number; // feet (corner lots)
}

export interface ADURules {
  allowed: boolean;
  maxSizeSqFt: number;
  maxSizePercent?: number;  // % of primary dwelling
  minLotSizeSqFt: number;
  setbacks: Setbacks;
  parking: number;          // required spaces
  requiresOwnerOccupancy: boolean;
  maxHeight?: number;       // feet
  notes?: string[];
}

export interface PoolRules {
  setbackFromProperty: number;
  setbackFromHouse: number;
  requiresFence: boolean;
  fenceHeight: number;
  permitRequired: boolean;
}

export interface GarageRules {
  setbackFront: number;
  setbackRear: number;
  setbackSide: number;
  maxHeightDetached: number;
  maxSizeWithoutPermit?: number;
}

export interface PermitThresholds {
  buildingExemptUnder: number;      // sq ft - under this, no permit
  electricalAlwaysRequired: boolean;
  plumbingAlwaysRequired: boolean;
  reroof: boolean;
  hvacChangeout: boolean;
  waterHeater: boolean;
}

export interface ZoningDistrict {
  code: string;
  name: string;
  description: string;
  minLotSize: number;           // sq ft
  maxLotCoverage: number;       // percentage
  maxBuildingHeight: number;    // feet
  setbacks: Setbacks;
  adu: ADURules;
  pool: PoolRules;
  garage: GarageRules;
  permits: PermitThresholds;
  notes?: string[];
}

// Phoenix Residential Zoning Districts
export const phoenixZoning: Record<string, ZoningDistrict> = {

  // ============================================
  // SINGLE-FAMILY RESIDENTIAL
  // ============================================

  "R1-18": {
    code: "R1-18",
    name: "Single-Family Residential (18,000 sf)",
    description: "Low-density single-family, large lots",
    minLotSize: 18000,
    maxLotCoverage: 35,
    maxBuildingHeight: 30,
    setbacks: {
      front: 25,
      rear: 25,
      side: 10,
      streetSide: 20,
    },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 25, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: {
      setbackFromProperty: 5,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 20,
      setbackRear: 5,
      setbackSide: 5,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },

  "R1-14": {
    code: "R1-14",
    name: "Single-Family Residential (14,000 sf)",
    description: "Low-density single-family",
    minLotSize: 14000,
    maxLotCoverage: 35,
    maxBuildingHeight: 30,
    setbacks: {
      front: 25,
      rear: 25,
      side: 7,
      streetSide: 20,
    },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 25, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: {
      setbackFromProperty: 5,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 20,
      setbackRear: 5,
      setbackSide: 5,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },

  "R1-10": {
    code: "R1-10",
    name: "Single-Family Residential (10,000 sf)",
    description: "Standard single-family residential",
    minLotSize: 10000,
    maxLotCoverage: 40,
    maxBuildingHeight: 30,
    setbacks: {
      front: 20,
      rear: 20,
      side: 5,
      streetSide: 15,
    },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
      notes: [
        "Detached ADU must be behind primary dwelling",
        "Cannot exceed height of primary dwelling",
      ],
    },
    pool: {
      setbackFromProperty: 5,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 20,
      setbackRear: 5,
      setbackSide: 5,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },

  "R1-8": {
    code: "R1-8",
    name: "Single-Family Residential (8,000 sf)",
    description: "Medium-density single-family",
    minLotSize: 8000,
    maxLotCoverage: 40,
    maxBuildingHeight: 30,
    setbacks: {
      front: 20,
      rear: 20,
      side: 5,
      streetSide: 15,
    },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: {
      setbackFromProperty: 5,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 20,
      setbackRear: 5,
      setbackSide: 5,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },

  "R1-6": {
    code: "R1-6",
    name: "Single-Family Residential (6,000 sf)",
    description: "Higher-density single-family",
    minLotSize: 6000,
    maxLotCoverage: 45,
    maxBuildingHeight: 30,
    setbacks: {
      front: 20,
      rear: 15,
      side: 5,
      streetSide: 15,
    },
    adu: {
      allowed: true,
      maxSizeSqFt: 800,
      minLotSizeSqFt: 6000,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
      notes: ["Smaller lot - ADU size limited to 800 sf"],
    },
    pool: {
      setbackFromProperty: 5,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 20,
      setbackRear: 5,
      setbackSide: 3,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },

  // ============================================
  // MULTI-FAMILY RESIDENTIAL
  // ============================================

  "R-2": {
    code: "R-2",
    name: "Two-Family Residential",
    description: "Duplex and two-family dwellings",
    minLotSize: 6000,
    maxLotCoverage: 50,
    maxBuildingHeight: 30,
    setbacks: {
      front: 20,
      rear: 15,
      side: 5,
      streetSide: 15,
    },
    adu: {
      allowed: true,
      maxSizeSqFt: 800,
      minLotSizeSqFt: 6000,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: {
      setbackFromProperty: 5,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 20,
      setbackRear: 5,
      setbackSide: 5,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },

  "R-3": {
    code: "R-3",
    name: "Multi-Family Residential",
    description: "Apartments, condos, townhomes",
    minLotSize: 6000,
    maxLotCoverage: 50,
    maxBuildingHeight: 40,
    setbacks: {
      front: 20,
      rear: 15,
      side: 10,
      streetSide: 15,
    },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 0,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
      notes: ["ADUs not applicable to multi-family zoning"],
    },
    pool: {
      setbackFromProperty: 10,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 20,
      setbackRear: 5,
      setbackSide: 10,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },

  "R-3A": {
    code: "R-3A",
    name: "Multi-Family Residential (High Rise)",
    description: "High-density apartments and condos",
    minLotSize: 10000,
    maxLotCoverage: 60,
    maxBuildingHeight: 56,
    setbacks: {
      front: 25,
      rear: 20,
      side: 15,
      streetSide: 20,
    },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 0,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
    },
    pool: {
      setbackFromProperty: 10,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 25,
      setbackRear: 10,
      setbackSide: 15,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },

  "R-4": {
    code: "R-4",
    name: "Multi-Family Residential (Medium High Rise)",
    description: "Medium high-density residential",
    minLotSize: 8000,
    maxLotCoverage: 55,
    maxBuildingHeight: 48,
    setbacks: {
      front: 25,
      rear: 20,
      side: 10,
      streetSide: 15,
    },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 0,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
    },
    pool: {
      setbackFromProperty: 10,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 25,
      setbackRear: 10,
      setbackSide: 10,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },

  "R-5": {
    code: "R-5",
    name: "Multi-Family Residential (High Density)",
    description: "Highest density residential",
    minLotSize: 10000,
    maxLotCoverage: 60,
    maxBuildingHeight: 250,
    setbacks: {
      front: 30,
      rear: 25,
      side: 15,
      streetSide: 20,
    },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 0,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
    },
    pool: {
      setbackFromProperty: 15,
      setbackFromHouse: 10,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 30,
      setbackRear: 15,
      setbackSide: 15,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },
};

// ============================================
// PROJECT TYPE REQUIREMENTS
// ============================================

export interface ProjectTypeRequirements {
  name: string;
  category: string;
  permits: string[];
  inspections: string[];
  typicalTimeline: string;
  estimatedPermitCost: { min: number; max: number };
  notes?: string[];
}

export const projectTypes: Record<string, ProjectTypeRequirements> = {

  "adu-detached": {
    name: "Detached ADU",
    category: "new-construction",
    permits: ["Building", "Electrical", "Plumbing", "Mechanical"],
    inspections: [
      "Foundation",
      "Framing",
      "Electrical Rough",
      "Plumbing Rough",
      "Mechanical Rough",
      "Insulation",
      "Drywall",
      "Final",
    ],
    typicalTimeline: "4-6 months",
    estimatedPermitCost: { min: 2000, max: 5000 },
    notes: [
      "Site plan required showing setbacks",
      "Must connect to city sewer or approved septic",
      "Impact fees may apply",
    ],
  },

  "adu-attached": {
    name: "Attached ADU",
    category: "addition",
    permits: ["Building", "Electrical", "Plumbing", "Mechanical"],
    inspections: [
      "Foundation",
      "Framing",
      "Electrical Rough",
      "Plumbing Rough",
      "Mechanical Rough",
      "Insulation",
      "Drywall",
      "Final",
    ],
    typicalTimeline: "3-5 months",
    estimatedPermitCost: { min: 1500, max: 4000 },
  },

  "adu-conversion": {
    name: "Garage Conversion ADU",
    category: "remodel",
    permits: ["Building", "Electrical", "Plumbing", "Mechanical"],
    inspections: [
      "Framing",
      "Electrical Rough",
      "Plumbing Rough",
      "Insulation",
      "Final",
    ],
    typicalTimeline: "2-4 months",
    estimatedPermitCost: { min: 1000, max: 3000 },
    notes: [
      "May require replacement parking",
      "Existing structure must meet current code or be upgraded",
    ],
  },

  "addition-bedroom": {
    name: "Bedroom Addition",
    category: "addition",
    permits: ["Building", "Electrical"],
    inspections: ["Foundation", "Framing", "Electrical Rough", "Insulation", "Final"],
    typicalTimeline: "2-3 months",
    estimatedPermitCost: { min: 800, max: 2000 },
  },

  "addition-bathroom": {
    name: "Bathroom Addition",
    category: "addition",
    permits: ["Building", "Electrical", "Plumbing"],
    inspections: [
      "Foundation",
      "Framing",
      "Electrical Rough",
      "Plumbing Rough",
      "Insulation",
      "Final",
    ],
    typicalTimeline: "2-3 months",
    estimatedPermitCost: { min: 1000, max: 2500 },
  },

  "addition-room": {
    name: "Room Addition",
    category: "addition",
    permits: ["Building", "Electrical", "Mechanical"],
    inspections: ["Foundation", "Framing", "Electrical Rough", "Mechanical", "Insulation", "Final"],
    typicalTimeline: "2-4 months",
    estimatedPermitCost: { min: 1000, max: 3000 },
  },

  "garage-new": {
    name: "New Garage",
    category: "new-construction",
    permits: ["Building", "Electrical"],
    inspections: ["Foundation", "Framing", "Electrical Rough", "Final"],
    typicalTimeline: "1-2 months",
    estimatedPermitCost: { min: 500, max: 1500 },
  },

  "pool": {
    name: "Swimming Pool",
    category: "new-construction",
    permits: ["Building", "Electrical", "Pool Barrier"],
    inspections: ["Pre-gunite", "Steel/Plumbing", "Equipment Bond", "Barrier", "Final"],
    typicalTimeline: "2-3 months",
    estimatedPermitCost: { min: 400, max: 1000 },
    notes: [
      "Pool barrier (fence) required before water",
      "Must be 5' minimum from property line",
      "Self-closing, self-latching gate required",
    ],
  },

  "remodel-kitchen": {
    name: "Kitchen Remodel",
    category: "remodel",
    permits: ["Building", "Electrical", "Plumbing"],
    inspections: ["Rough", "Final"],
    typicalTimeline: "1-2 months",
    estimatedPermitCost: { min: 400, max: 1200 },
    notes: ["Permit required if moving plumbing or electrical"],
  },

  "remodel-bathroom": {
    name: "Bathroom Remodel",
    category: "remodel",
    permits: ["Building", "Electrical", "Plumbing"],
    inspections: ["Rough", "Final"],
    typicalTimeline: "2-4 weeks",
    estimatedPermitCost: { min: 300, max: 800 },
    notes: ["Permit required if moving plumbing or electrical"],
  },

  "electrical-panel": {
    name: "Electrical Panel Upgrade",
    category: "electrical",
    permits: ["Electrical"],
    inspections: ["Final"],
    typicalTimeline: "1-2 weeks",
    estimatedPermitCost: { min: 150, max: 400 },
    notes: ["Required when adding significant load (ADU, pool, EV charger)"],
  },

  "patio-cover": {
    name: "Patio Cover",
    category: "outdoor",
    permits: ["Building"],
    inspections: ["Foundation/Post", "Final"],
    typicalTimeline: "2-4 weeks",
    estimatedPermitCost: { min: 200, max: 600 },
    notes: ["Permit required if attached to house or over 200 sq ft"],
  },

  "block-wall": {
    name: "Block Wall/Fence",
    category: "outdoor",
    permits: ["Building"],
    inspections: ["Foundation", "Final"],
    typicalTimeline: "1-2 weeks",
    estimatedPermitCost: { min: 150, max: 400 },
    notes: ["Permit required if over 6' in height"],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getZoningByCode(code: string): ZoningDistrict | null {
  // Normalize the code (handle variations like "R1-10" vs "R-1-10")
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');

  // Direct match
  if (phoenixZoning[normalizedCode]) {
    return phoenixZoning[normalizedCode];
  }

  // Try variations
  const variations = [
    normalizedCode,
    normalizedCode.replace('R-1-', 'R1-'),
    normalizedCode.replace('R1-', 'R-1-'),
  ];

  for (const variant of variations) {
    if (phoenixZoning[variant]) {
      return phoenixZoning[variant];
    }
  }

  return null;
}

export function getProjectRequirements(projectType: string): ProjectTypeRequirements | null {
  return projectTypes[projectType] || null;
}

export function isADUAllowed(zoning: ZoningDistrict, lotSizeSqFt: number): {
  allowed: boolean;
  reason?: string;
  maxSize?: number;
} {
  if (!zoning.adu.allowed) {
    return { allowed: false, reason: "ADUs not permitted in this zoning district" };
  }

  if (lotSizeSqFt < zoning.adu.minLotSizeSqFt) {
    return {
      allowed: false,
      reason: `Lot must be at least ${zoning.adu.minLotSizeSqFt.toLocaleString()} sq ft (yours is ${lotSizeSqFt.toLocaleString()})`
    };
  }

  return {
    allowed: true,
    maxSize: zoning.adu.maxSizeSqFt
  };
}

export function validateSetbacks(
  zoning: ZoningDistrict,
  structure: { front?: number; rear?: number; side?: number },
  projectType: 'primary' | 'adu' | 'garage' | 'pool'
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  let requiredSetbacks: Partial<Setbacks>;

  switch (projectType) {
    case 'adu':
      requiredSetbacks = zoning.adu.setbacks;
      break;
    case 'pool':
      requiredSetbacks = {
        front: zoning.pool.setbackFromProperty,
        rear: zoning.pool.setbackFromProperty,
        side: zoning.pool.setbackFromProperty
      };
      break;
    case 'garage':
      requiredSetbacks = {
        front: zoning.garage.setbackFront,
        rear: zoning.garage.setbackRear,
        side: zoning.garage.setbackSide,
      };
      break;
    default:
      requiredSetbacks = zoning.setbacks;
  }

  if (structure.front !== undefined && requiredSetbacks.front && structure.front < requiredSetbacks.front) {
    violations.push(`Front setback: ${structure.front}' provided, ${requiredSetbacks.front}' required`);
  }
  if (structure.rear !== undefined && requiredSetbacks.rear && structure.rear < requiredSetbacks.rear) {
    violations.push(`Rear setback: ${structure.rear}' provided, ${requiredSetbacks.rear}' required`);
  }
  if (structure.side !== undefined && requiredSetbacks.side && structure.side < requiredSetbacks.side) {
    violations.push(`Side setback: ${structure.side}' provided, ${requiredSetbacks.side}' required`);
  }

  return { valid: violations.length === 0, violations };
}

export function getSmartHint(
  zoning: ZoningDistrict,
  projectType: string,
  context: { lotSize?: number; proposedSize?: number }
): string {
  const hints: string[] = [];

  if (projectType.includes('adu')) {
    const aduCheck = isADUAllowed(zoning, context.lotSize || 0);
    if (aduCheck.allowed) {
      hints.push(`✅ ADUs allowed (max ${aduCheck.maxSize} sf)`);
      hints.push(`Setbacks: ${zoning.adu.setbacks.side}' sides, ${zoning.adu.setbacks.rear}' rear`);
      if (context.proposedSize && context.proposedSize > (aduCheck.maxSize || 0)) {
        hints.push(`⚠️ Proposed ${context.proposedSize} sf exceeds max ${aduCheck.maxSize} sf`);
      }
    } else {
      hints.push(`❌ ${aduCheck.reason}`);
    }
  }

  if (projectType === 'pool') {
    hints.push(`Pool setback: ${zoning.pool.setbackFromProperty}' from property line`);
    hints.push(`Fence required: ${zoning.pool.fenceHeight}' minimum height`);
  }

  if (projectType.includes('garage')) {
    hints.push(`Garage setbacks: ${zoning.garage.setbackFront}' front, ${zoning.garage.setbackSide}' side`);
  }

  return hints.join('\n');
}

// Export everything
export default {
  phoenixZoning,
  projectTypes,
  getZoningByCode,
  getProjectRequirements,
  isADUAllowed,
  validateSetbacks,
  getSmartHint,
};
