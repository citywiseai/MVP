// lib/municipal-data/prescott-valley.ts
// Prescott Valley, AZ Municipal Zoning Database
// Note: Largest town in Yavapai County

import type { ZoningDistrict } from './phoenix';

export const prescottValleyZoning: Record<string, ZoningDistrict> = {

  "R1-70": {
    code: "R1-70",
    name: "Single-Family (70,000 sf)",
    description: "Estate residential (1.6 acres)",
    minLotSize: 70000,
    maxLotCoverage: 25,
    maxBuildingHeight: 28,
    setbacks: { front: 40, rear: 40, side: 25, streetSide: 35 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 40, rear: 20, side: 20, streetSide: 30 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 24,
      notes: ["Prescott Valley - largest town in Yavapai County"],
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 35, setbackRear: 20, setbackSide: 20, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-35": {
    code: "R1-35",
    name: "Single-Family (35,000 sf)",
    description: "Large lot residential",
    minLotSize: 35000,
    maxLotCoverage: 30,
    maxBuildingHeight: 28,
    setbacks: { front: 30, rear: 30, side: 15, streetSide: 25 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 30, rear: 15, side: 10, streetSide: 20 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 24,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 25, setbackRear: 15, setbackSide: 10, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-12": {
    code: "R1-12",
    name: "Single-Family (12,000 sf)",
    description: "Medium-large lot",
    minLotSize: 12000,
    maxLotCoverage: 35,
    maxBuildingHeight: 28,
    setbacks: { front: 25, rear: 25, side: 8, streetSide: 20 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 25, rear: 10, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 24,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 10, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-8": {
    code: "R1-8",
    name: "Single-Family (8,000 sf)",
    description: "Standard single-family",
    minLotSize: 8000,
    maxLotCoverage: 40,
    maxBuildingHeight: 28,
    setbacks: { front: 20, rear: 20, side: 5, streetSide: 15 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 24,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-6": {
    code: "R1-6",
    name: "Single-Family (6,000 sf)",
    description: "Medium lot single-family",
    minLotSize: 6000,
    maxLotCoverage: 45,
    maxBuildingHeight: 28,
    setbacks: { front: 20, rear: 15, side: 5, streetSide: 10 },
    adu: {
      allowed: true,
      maxSizeSqFt: 800,
      minLotSizeSqFt: 6000,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 10 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 3, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R-3": {
    code: "R-3",
    name: "Multi-Family Residential",
    description: "Apartments and condos",
    minLotSize: 8000,
    maxLotCoverage: 55,
    maxBuildingHeight: 35,
    setbacks: { front: 25, rear: 20, side: 10, streetSide: 15 },
    adu: { allowed: false, maxSizeSqFt: 0, minLotSizeSqFt: 0, setbacks: { front: 0, rear: 0, side: 0 }, parking: 0, requiresOwnerOccupancy: false },
    pool: { setbackFromProperty: 10, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 25, setbackRear: 10, setbackSide: 10, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },
};

export function getZoningByCode(code: string): ZoningDistrict | null {
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');
  return prescottValleyZoning[normalizedCode] || null;
}

export default prescottValleyZoning;
