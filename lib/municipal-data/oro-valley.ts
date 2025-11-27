// lib/municipal-data/oro-valley.ts
// Oro Valley, AZ Municipal Zoning Database
// Note: Upscale suburb north of Tucson, Catalina Mountains

import type { ZoningDistrict } from './phoenix';

export const oroValleyZoning: Record<string, ZoningDistrict> = {

  "R1-144": {
    code: "R1-144",
    name: "Single-Family (3.3 acres)",
    description: "Rural estate",
    minLotSize: 144000,
    maxLotCoverage: 20,
    maxBuildingHeight: 24,
    setbacks: { front: 60, rear: 60, side: 40, streetSide: 50 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1200,
      minLotSizeSqFt: 20000,
      setbacks: { front: 60, rear: 30, side: 30, streetSide: 40 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
      notes: ["Oro Valley - upscale Tucson suburb", "Catalina Mountain foothills"],
    },
    pool: { setbackFromProperty: 15, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 50, setbackRear: 30, setbackSide: 30, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-72": {
    code: "R1-72",
    name: "Single-Family (72,000 sf)",
    description: "Large estate",
    minLotSize: 72000,
    maxLotCoverage: 25,
    maxBuildingHeight: 24,
    setbacks: { front: 50, rear: 50, side: 30, streetSide: 40 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 20000,
      setbacks: { front: 50, rear: 25, side: 25, streetSide: 35 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 40, setbackRear: 25, setbackSide: 25, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-36": {
    code: "R1-36",
    name: "Single-Family (36,000 sf)",
    description: "Estate lots",
    minLotSize: 36000,
    maxLotCoverage: 30,
    maxBuildingHeight: 28,
    setbacks: { front: 40, rear: 40, side: 20, streetSide: 30 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 20000,
      setbacks: { front: 40, rear: 15, side: 15, streetSide: 25 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 30, setbackRear: 15, setbackSide: 15, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-20": {
    code: "R1-20",
    name: "Single-Family (20,000 sf)",
    description: "Large lot residential",
    minLotSize: 20000,
    maxLotCoverage: 35,
    maxBuildingHeight: 28,
    setbacks: { front: 30, rear: 30, side: 15, streetSide: 25 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 20000,
      setbacks: { front: 30, rear: 10, side: 10, streetSide: 20 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 25, setbackRear: 10, setbackSide: 10, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-10": {
    code: "R1-10",
    name: "Single-Family (10,000 sf)",
    description: "Standard single-family",
    minLotSize: 10000,
    maxLotCoverage: 40,
    maxBuildingHeight: 28,
    setbacks: { front: 25, rear: 25, side: 8, streetSide: 20 },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 20000,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
      notes: ["Lot too small for ADU (20,000 sf minimum in Oro Valley)"],
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-7": {
    code: "R1-7",
    name: "Single-Family (7,000 sf)",
    description: "Medium lot single-family",
    minLotSize: 7000,
    maxLotCoverage: 45,
    maxBuildingHeight: 28,
    setbacks: { front: 20, rear: 20, side: 5, streetSide: 15 },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 20000,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
      notes: ["Lot too small for ADU"],
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
  return oroValleyZoning[normalizedCode] || null;
}

export default oroValleyZoning;
