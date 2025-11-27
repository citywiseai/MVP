// lib/municipal-data/flagstaff.ts
// Flagstaff, AZ Municipal Zoning Database
// Note: Mountain city, NAU, strict environmental regulations

import type { ZoningDistrict } from './phoenix';

export const flagstaffZoning: Record<string, ZoningDistrict> = {

  "ER": {
    code: "ER",
    name: "Estate Residential",
    description: "Large lot estate (2.5 acre min)",
    minLotSize: 108900,
    maxLotCoverage: 20,
    maxBuildingHeight: 32,
    setbacks: { front: 50, rear: 50, side: 30, streetSide: 40 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 50, rear: 25, side: 25, streetSide: 35 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 24,
      notes: ["Flagstaff - mountain city at 7,000 ft elevation", "NAU campus", "Strict environmental and dark sky regulations"],
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 40, setbackRear: 25, setbackSide: 25, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "RR": {
    code: "RR",
    name: "Rural Residential",
    description: "Rural lots (1 acre min)",
    minLotSize: 43560,
    maxLotCoverage: 25,
    maxBuildingHeight: 32,
    setbacks: { front: 40, rear: 40, side: 20, streetSide: 30 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 40, rear: 20, side: 15, streetSide: 25 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 24,
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 30, setbackRear: 20, setbackSide: 15, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1": {
    code: "R1",
    name: "Single-Family (15,000 sf)",
    description: "Low density single-family",
    minLotSize: 15000,
    maxLotCoverage: 35,
    maxBuildingHeight: 32,
    setbacks: { front: 25, rear: 25, side: 10, streetSide: 20 },
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

  "R1N": {
    code: "R1N",
    name: "Single-Family Neighborhood",
    description: "Standard single-family (10,000 sf)",
    minLotSize: 10000,
    maxLotCoverage: 40,
    maxBuildingHeight: 32,
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

  "R2": {
    code: "R2",
    name: "Single-Family (7,000 sf)",
    description: "Medium density single-family",
    minLotSize: 7000,
    maxLotCoverage: 45,
    maxBuildingHeight: 32,
    setbacks: { front: 20, rear: 15, side: 5, streetSide: 10 },
    adu: {
      allowed: true,
      maxSizeSqFt: 850,
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

  "R3": {
    code: "R3",
    name: "Single-Family (5,000 sf)",
    description: "Higher density single-family",
    minLotSize: 5000,
    maxLotCoverage: 50,
    maxBuildingHeight: 32,
    setbacks: { front: 15, rear: 15, side: 5, streetSide: 10 },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 6000,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
      notes: ["Lot too small for ADU"],
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 15, setbackRear: 5, setbackSide: 3, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R4": {
    code: "R4",
    name: "Multi-Family Residential",
    description: "Apartments and condos",
    minLotSize: 6000,
    maxLotCoverage: 55,
    maxBuildingHeight: 40,
    setbacks: { front: 20, rear: 15, side: 10, streetSide: 15 },
    adu: { allowed: false, maxSizeSqFt: 0, minLotSizeSqFt: 0, setbacks: { front: 0, rear: 0, side: 0 }, parking: 0, requiresOwnerOccupancy: false },
    pool: { setbackFromProperty: 10, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 10, setbackSide: 10, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },
};

export function getZoningByCode(code: string): ZoningDistrict | null {
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');
  return flagstaffZoning[normalizedCode] || null;
}

export default flagstaffZoning;
