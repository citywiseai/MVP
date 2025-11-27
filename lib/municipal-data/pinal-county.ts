// lib/municipal-data/pinal-county.ts
// Pinal County (Unincorporated Areas) Zoning Database
// Note: Covers San Tan Valley, Gold Canyon, Oracle, and other unincorporated areas

import type { ZoningDistrict } from './phoenix';

export const pinalCountyZoning: Record<string, ZoningDistrict> = {
  
  "CR-1": {
    code: "CR-1",
    name: "Rural Residential (1 acre)",
    description: "Rural single-family",
    minLotSize: 43560,
    maxLotCoverage: 25,
    maxBuildingHeight: 30,
    setbacks: { front: 40, rear: 40, side: 20, streetSide: 30 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 10000,
      setbacks: { front: 40, rear: 15, side: 15, streetSide: 25 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
      notes: ["Pinal County unincorporated", "Includes San Tan Valley, Gold Canyon, Oracle"],
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 30, setbackRear: 15, setbackSide: 15, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "CR-2": {
    code: "CR-2",
    name: "Rural Residential (36,000 sf)",
    description: "Large lot residential",
    minLotSize: 36000,
    maxLotCoverage: 30,
    maxBuildingHeight: 30,
    setbacks: { front: 35, rear: 35, side: 15, streetSide: 25 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 10000,
      setbacks: { front: 35, rear: 10, side: 10, streetSide: 20 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 25, setbackRear: 10, setbackSide: 10, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "CR-3": {
    code: "CR-3",
    name: "Rural Residential (16,000 sf)",
    description: "Medium-large lot",
    minLotSize: 16000,
    maxLotCoverage: 35,
    maxBuildingHeight: 30,
    setbacks: { front: 30, rear: 25, side: 10, streetSide: 20 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 10000,
      setbacks: { front: 30, rear: 10, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 25, setbackRear: 10, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "CR-4": {
    code: "CR-4",
    name: "Rural Residential (10,000 sf)",
    description: "Standard single-family",
    minLotSize: 10000,
    maxLotCoverage: 40,
    maxBuildingHeight: 30,
    setbacks: { front: 25, rear: 20, side: 7, streetSide: 15 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 10000,
      setbacks: { front: 25, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "CR-5": {
    code: "CR-5",
    name: "Rural Residential (7,000 sf)",
    description: "Higher density single-family",
    minLotSize: 7000,
    maxLotCoverage: 45,
    maxBuildingHeight: 30,
    setbacks: { front: 20, rear: 15, side: 5, streetSide: 10 },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 10000,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
      notes: ["Lot too small for ADU (10,000 sf minimum in unincorporated Pinal County)"],
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 3, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "GR": {
    code: "GR",
    name: "General Rural",
    description: "Agricultural/ranch (2.5 acre min)",
    minLotSize: 108900,
    maxLotCoverage: 15,
    maxBuildingHeight: 30,
    setbacks: { front: 50, rear: 50, side: 30, streetSide: 40 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1200,
      minLotSizeSqFt: 10000,
      setbacks: { front: 50, rear: 20, side: 20, streetSide: 30 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
      notes: ["Agricultural uses allowed", "Guest houses and casitas common"],
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 40, setbackRear: 20, setbackSide: 20, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "SR": {
    code: "SR",
    name: "Suburban Ranch",
    description: "Large lot suburban (1 acre)",
    minLotSize: 43560,
    maxLotCoverage: 25,
    maxBuildingHeight: 30,
    setbacks: { front: 40, rear: 40, side: 20, streetSide: 30 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 10000,
      setbacks: { front: 40, rear: 15, side: 15, streetSide: 25 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 30, setbackRear: 15, setbackSide: 15, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "PAD": {
    code: "PAD",
    name: "Planned Area Development",
    description: "Master-planned community (varies)",
    minLotSize: 6000,
    maxLotCoverage: 50,
    maxBuildingHeight: 35,
    setbacks: { front: 20, rear: 15, side: 5, streetSide: 10 },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 0,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
      notes: ["PAD zoning varies by development", "Check specific HOA/development rules", "San Tan Valley has many PAD communities"],
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },
};

export function getZoningByCode(code: string): ZoningDistrict | null {
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');
  return pinalCountyZoning[normalizedCode] || null;
}

export default pinalCountyZoning;
