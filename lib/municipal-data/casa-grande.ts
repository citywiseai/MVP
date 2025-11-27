// lib/municipal-data/casa-grande.ts
// Casa Grande, AZ Municipal Zoning Database
// Note: Largest city in Pinal County, growing industrial hub

import type { ZoningDistrict } from './phoenix';

export const casaGrandeZoning: Record<string, ZoningDistrict> = {

  "R1-43": {
    code: "R1-43",
    name: "Single-Family (1 acre)",
    description: "Estate/rural residential",
    minLotSize: 43560,
    maxLotCoverage: 30,
    maxBuildingHeight: 30,
    setbacks: { front: 35, rear: 35, side: 15, streetSide: 25 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 35, rear: 10, side: 10, streetSide: 20 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
      notes: ["Casa Grande - largest city in Pinal County", "Growing industrial hub between Phoenix and Tucson"],
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 25, setbackRear: 10, setbackSide: 10, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-15": {
    code: "R1-15",
    name: "Single-Family (15,000 sf)",
    description: "Large lot residential",
    minLotSize: 15000,
    maxLotCoverage: 35,
    maxBuildingHeight: 30,
    setbacks: { front: 25, rear: 25, side: 8, streetSide: 20 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
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
      minLotSizeSqFt: 6000,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-8": {
    code: "R1-8",
    name: "Single-Family (8,000 sf)",
    description: "Medium lot single-family",
    minLotSize: 8000,
    maxLotCoverage: 40,
    maxBuildingHeight: 30,
    setbacks: { front: 20, rear: 20, side: 5, streetSide: 15 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-6": {
    code: "R1-6",
    name: "Single-Family (6,000 sf)",
    description: "Higher density single-family",
    minLotSize: 6000,
    maxLotCoverage: 45,
    maxBuildingHeight: 30,
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

  "R1-5": {
    code: "R1-5",
    name: "Single-Family (5,000 sf)",
    description: "Small lot single-family",
    minLotSize: 5000,
    maxLotCoverage: 50,
    maxBuildingHeight: 30,
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

  "R-2": {
    code: "R-2",
    name: "Two-Family Residential",
    description: "Duplex housing",
    minLotSize: 6000,
    maxLotCoverage: 50,
    maxBuildingHeight: 30,
    setbacks: { front: 20, rear: 15, side: 5, streetSide: 10 },
    adu: { allowed: false, maxSizeSqFt: 0, minLotSizeSqFt: 0, setbacks: { front: 0, rear: 0, side: 0 }, parking: 0, requiresOwnerOccupancy: false },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R-3": {
    code: "R-3",
    name: "Multi-Family Residential",
    description: "Apartments and condos",
    minLotSize: 8000,
    maxLotCoverage: 55,
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
  return casaGrandeZoning[normalizedCode] || null;
}

export default casaGrandeZoning;
