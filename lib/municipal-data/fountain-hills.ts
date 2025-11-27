// lib/municipal-data/fountain-hills.ts
// Fountain Hills, AZ Municipal Zoning Database
// Note: Home of world's tallest fountain

import type { ZoningDistrict } from './phoenix';

export const fountainHillsZoning: Record<string, ZoningDistrict> = {

  "R1-43": {
    code: "R1-43",
    name: "Single-Family (1 acre)",
    description: "Estate residential",
    minLotSize: 43560,
    maxLotCoverage: 30,
    maxBuildingHeight: 30,
    setbacks: { front: 40, rear: 35, side: 15, streetSide: 25 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 7500,
      setbacks: { front: 40, rear: 10, side: 10, streetSide: 20 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
      notes: ["Fountain Hills - home of world's tallest fountain"],
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 30, setbackRear: 10, setbackSide: 10, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-18": {
    code: "R1-18",
    name: "Single-Family (18,000 sf)",
    description: "Large lot residential",
    minLotSize: 18000,
    maxLotCoverage: 35,
    maxBuildingHeight: 30,
    setbacks: { front: 25, rear: 25, side: 10, streetSide: 20 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 7500,
      setbacks: { front: 25, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-10": {
    code: "R1-10",
    name: "Single-Family (10,000 sf)",
    description: "Standard single-family",
    minLotSize: 10000,
    maxLotCoverage: 40,
    maxBuildingHeight: 30,
    setbacks: { front: 20, rear: 20, side: 5, streetSide: 15 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 7500,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-7.5": {
    code: "R1-7.5",
    name: "Single-Family (7,500 sf)",
    description: "Medium lot single-family",
    minLotSize: 7500,
    maxLotCoverage: 40,
    maxBuildingHeight: 30,
    setbacks: { front: 20, rear: 20, side: 5, streetSide: 15 },
    adu: {
      allowed: true,
      maxSizeSqFt: 800,
      minLotSizeSqFt: 7500,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R-3": {
    code: "R-3",
    name: "Multi-Family Residential",
    description: "Apartments and condos",
    minLotSize: 8000,
    maxLotCoverage: 50,
    maxBuildingHeight: 40,
    setbacks: { front: 25, rear: 20, side: 10, streetSide: 15 },
    adu: { allowed: false, maxSizeSqFt: 0, minLotSizeSqFt: 0, setbacks: { front: 0, rear: 0, side: 0 }, parking: 0, requiresOwnerOccupancy: false },
    pool: { setbackFromProperty: 10, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 25, setbackRear: 10, setbackSide: 10, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },
};

export function getZoningByCode(code: string): ZoningDistrict | null {
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');

  // Handle codes with periods (e.g., "R1-7.5")
  for (const [key, value] of Object.entries(fountainHillsZoning)) {
    if (key.replace('.', '') === normalizedCode.replace('.', '') || key === normalizedCode) {
      return value;
    }
  }

  return null;
}

export default fountainHillsZoning;
