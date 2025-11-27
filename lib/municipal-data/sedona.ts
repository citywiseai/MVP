// lib/municipal-data/sedona.ts
// Sedona, AZ Municipal Zoning Database
// Note: Red rock country, strict design standards, spans Yavapai and Coconino counties

import type { ZoningDistrict } from './phoenix';

export const sedonaZoning: Record<string, ZoningDistrict> = {

  "RR": {
    code: "RR",
    name: "Rural Residential",
    description: "Rural estate (2.5 acres)",
    minLotSize: 108900,
    maxLotCoverage: 20,
    maxBuildingHeight: 24,
    setbacks: { front: 50, rear: 50, side: 30, streetSide: 40 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 15000,
      setbacks: { front: 50, rear: 25, side: 25, streetSide: 35 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
      notes: ["Sedona - red rock country", "Strict architectural design standards", "Spans Yavapai and Coconino counties", "15,000 sf lot minimum for ADU (strictest in AZ)"],
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 40, setbackRear: 25, setbackSide: 25, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "RCR": {
    code: "RCR",
    name: "Residential Country Residential",
    description: "Large lot country residential (1 acre)",
    minLotSize: 43560,
    maxLotCoverage: 25,
    maxBuildingHeight: 24,
    setbacks: { front: 40, rear: 40, side: 20, streetSide: 30 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 15000,
      setbacks: { front: 40, rear: 20, side: 15, streetSide: 25 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 35, setbackRear: 20, setbackSide: 15, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-20": {
    code: "R1-20",
    name: "Single-Family (20,000 sf)",
    description: "Large lot residential",
    minLotSize: 20000,
    maxLotCoverage: 30,
    maxBuildingHeight: 24,
    setbacks: { front: 30, rear: 30, side: 15, streetSide: 25 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 15000,
      setbacks: { front: 30, rear: 15, side: 10, streetSide: 20 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 25, setbackRear: 15, setbackSide: 10, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-15": {
    code: "R1-15",
    name: "Single-Family (15,000 sf)",
    description: "Medium-large lot",
    minLotSize: 15000,
    maxLotCoverage: 35,
    maxBuildingHeight: 24,
    setbacks: { front: 25, rear: 25, side: 10, streetSide: 20 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 15000,
      setbacks: { front: 25, rear: 10, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 10, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-10": {
    code: "R1-10",
    name: "Single-Family (10,000 sf)",
    description: "Standard single-family",
    minLotSize: 10000,
    maxLotCoverage: 40,
    maxBuildingHeight: 24,
    setbacks: { front: 20, rear: 20, side: 5, streetSide: 15 },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 15000,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
      notes: ["Lot too small for ADU (15,000 sf minimum in Sedona)"],
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "MR": {
    code: "MR",
    name: "Multi-Family Residential",
    description: "Multi-family residential",
    minLotSize: 12000,
    maxLotCoverage: 50,
    maxBuildingHeight: 30,
    setbacks: { front: 25, rear: 20, side: 10, streetSide: 15 },
    adu: { allowed: false, maxSizeSqFt: 0, minLotSizeSqFt: 0, setbacks: { front: 0, rear: 0, side: 0 }, parking: 0, requiresOwnerOccupancy: false },
    pool: { setbackFromProperty: 10, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 25, setbackRear: 10, setbackSide: 10, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },
};

export function getZoningByCode(code: string): ZoningDistrict | null {
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');
  return sedonaZoning[normalizedCode] || null;
}

export default sedonaZoning;
