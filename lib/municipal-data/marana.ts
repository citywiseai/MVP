// lib/municipal-data/marana.ts
// Marana, AZ Municipal Zoning Database
// Note: Fast-growing northwest Tucson suburb

import type { ZoningDistrict } from './phoenix';

export const maranaZoning: Record<string, ZoningDistrict> = {

  "R-144": {
    code: "R-144",
    name: "Single-Family (144,000 sf)",
    description: "Rural residential",
    minLotSize: 144000,
    maxLotCoverage: 20,
    maxBuildingHeight: 30,
    setbacks: { front: 50, rear: 50, side: 30, streetSide: 40 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 7000,
      setbacks: { front: 50, rear: 25, side: 25, streetSide: 35 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
      notes: ["Marana - fast-growing NW Tucson suburb"],
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 40, setbackRear: 25, setbackSide: 25, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R-36": {
    code: "R-36",
    name: "Single-Family (36,000 sf)",
    description: "Large lot residential",
    minLotSize: 36000,
    maxLotCoverage: 30,
    maxBuildingHeight: 30,
    setbacks: { front: 35, rear: 35, side: 15, streetSide: 25 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 7000,
      setbacks: { front: 35, rear: 15, side: 10, streetSide: 20 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 25, setbackRear: 15, setbackSide: 10, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R-16": {
    code: "R-16",
    name: "Single-Family (16,000 sf)",
    description: "Medium-large lot",
    minLotSize: 16000,
    maxLotCoverage: 35,
    maxBuildingHeight: 30,
    setbacks: { front: 25, rear: 25, side: 10, streetSide: 20 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 7000,
      setbacks: { front: 25, rear: 10, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 10, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R-10": {
    code: "R-10",
    name: "Single-Family (10,000 sf)",
    description: "Standard single-family",
    minLotSize: 10000,
    maxLotCoverage: 40,
    maxBuildingHeight: 30,
    setbacks: { front: 20, rear: 20, side: 5, streetSide: 15 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 7000,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R-7": {
    code: "R-7",
    name: "Single-Family (7,000 sf)",
    description: "Medium lot single-family",
    minLotSize: 7000,
    maxLotCoverage: 45,
    maxBuildingHeight: 30,
    setbacks: { front: 20, rear: 15, side: 5, streetSide: 10 },
    adu: {
      allowed: true,
      maxSizeSqFt: 800,
      minLotSizeSqFt: 7000,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 10 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 3, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R-5": {
    code: "R-5",
    name: "Single-Family (5,000 sf)",
    description: "Higher density single-family",
    minLotSize: 5000,
    maxLotCoverage: 50,
    maxBuildingHeight: 30,
    setbacks: { front: 15, rear: 15, side: 5, streetSide: 10 },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 7000,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
      notes: ["Lot too small for ADU (7,000 sf minimum in Marana)"],
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 15, setbackRear: 5, setbackSide: 3, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "MR": {
    code: "MR",
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
  return maranaZoning[normalizedCode] || null;
}

export default maranaZoning;
