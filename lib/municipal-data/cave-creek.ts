// lib/municipal-data/cave-creek.ts
// Cave Creek, AZ Municipal Zoning Database
// Note: Western/rural character, horses allowed, larger lots

import type { ZoningDistrict } from './phoenix';

export const caveCreekZoning: Record<string, ZoningDistrict> = {

  "R1-130": {
    code: "R1-130",
    name: "Single-Family (3 acres)",
    description: "Very large rural residential, horses allowed",
    minLotSize: 130680,
    maxLotCoverage: 15,
    maxBuildingHeight: 30,
    setbacks: { front: 50, rear: 50, side: 30, streetSide: 40 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1200,
      minLotSizeSqFt: 43560,
      setbacks: { front: 50, rear: 20, side: 20, streetSide: 35 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
      notes: ["Cave Creek - western/rural character, horses allowed on 3+ acre lots"],
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 40, setbackRear: 20, setbackSide: 20, maxHeightDetached: 20 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-70": {
    code: "R1-70",
    name: "Single-Family (70,000 sf / 1.6 acres)",
    description: "Large rural lots, horses allowed",
    minLotSize: 70000,
    maxLotCoverage: 20,
    maxBuildingHeight: 30,
    setbacks: { front: 40, rear: 40, side: 25, streetSide: 35 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 43560,
      setbacks: { front: 40, rear: 15, side: 15, streetSide: 30 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
      notes: ["Horses allowed on 1.6+ acre lots"],
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 35, setbackRear: 15, setbackSide: 15, maxHeightDetached: 20 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-43": {
    code: "R1-43",
    name: "Single-Family (1 acre)",
    description: "One acre minimum estate lots, horses allowed",
    minLotSize: 43560,
    maxLotCoverage: 25,
    maxBuildingHeight: 30,
    setbacks: { front: 35, rear: 35, side: 20, streetSide: 30 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 43560,
      setbacks: { front: 35, rear: 10, side: 10, streetSide: 25 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
      notes: ["Horses allowed on 1+ acre lots"],
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 30, setbackRear: 10, setbackSide: 10, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-35": {
    code: "R1-35",
    name: "Single-Family (35,000 sf)",
    description: "Large lot residential",
    minLotSize: 35000,
    maxLotCoverage: 30,
    maxBuildingHeight: 30,
    setbacks: { front: 30, rear: 30, side: 15, streetSide: 25 },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 43560,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
      notes: ["Lot too small for ADU (1 acre minimum in Cave Creek)"],
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 25, setbackRear: 10, setbackSide: 10, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },
};

export function getZoningByCode(code: string): ZoningDistrict | null {
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');
  return caveCreekZoning[normalizedCode] || null;
}

export default caveCreekZoning;
