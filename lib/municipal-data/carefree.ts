// lib/municipal-data/carefree.ts
// Carefree, AZ Municipal Zoning Database
// Note: Upscale community, dark sky ordinance

import type { ZoningDistrict } from './phoenix';

export const carefreeZoning: Record<string, ZoningDistrict> = {

  "R1-70": {
    code: "R1-70",
    name: "Single-Family (70,000 sf / 1.6 acres)",
    description: "Large estate residential",
    minLotSize: 70000,
    maxLotCoverage: 20,
    maxBuildingHeight: 24,
    setbacks: { front: 60, rear: 50, side: 30, streetSide: 40 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 43560,
      setbacks: { front: 60, rear: 25, side: 20, streetSide: 35 },
      parking: 2,
      requiresOwnerOccupancy: true,
      maxHeight: 18,
      notes: ["Carefree - upscale community with dark sky ordinance", "ADUs require 1 acre minimum"],
    },
    pool: { setbackFromProperty: 15, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 50, setbackRear: 25, setbackSide: 20, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 120, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-43": {
    code: "R1-43",
    name: "Single-Family (1 acre)",
    description: "One acre estate lots",
    minLotSize: 43560,
    maxLotCoverage: 25,
    maxBuildingHeight: 24,
    setbacks: { front: 50, rear: 40, side: 25, streetSide: 35 },
    adu: {
      allowed: true,
      maxSizeSqFt: 800,
      minLotSizeSqFt: 43560,
      setbacks: { front: 50, rear: 20, side: 15, streetSide: 30 },
      parking: 2,
      requiresOwnerOccupancy: true,
      maxHeight: 18,
      notes: ["Dark sky ordinance - exterior lighting restrictions apply"],
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 40, setbackRear: 20, setbackSide: 15, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 120, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-35": {
    code: "R1-35",
    name: "Single-Family (35,000 sf)",
    description: "Large lot residential",
    minLotSize: 35000,
    maxLotCoverage: 30,
    maxBuildingHeight: 24,
    setbacks: { front: 40, rear: 35, side: 20, streetSide: 30 },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 43560,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
      notes: ["Lot too small for ADU (1 acre minimum in Carefree)"],
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 35, setbackRear: 15, setbackSide: 15, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 120, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },
};

export function getZoningByCode(code: string): ZoningDistrict | null {
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');
  return carefreeZoning[normalizedCode] || null;
}

export default carefreeZoning;
