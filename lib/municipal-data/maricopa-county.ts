// lib/municipal-data/maricopa-county.ts
// Maricopa County (Unincorporated Areas) Zoning Database
// Note: Covers Anthem, New River, Desert Hills, Rio Verde, and other unincorporated areas

import type { ZoningDistrict } from './phoenix';

export const maricopaCountyZoning: Record<string, ZoningDistrict> = {
  
  "R1-43": {
    code: "R1-43",
    name: "Single-Family (1 acre)",
    description: "Rural residential",
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
      notes: ["Maricopa County unincorporated", "Includes Anthem, New River, Desert Hills, Rio Verde"],
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 30, setbackRear: 15, setbackSide: 15, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R1-35": {
    code: "R1-35",
    name: "Single-Family (35,000 sf)",
    description: "Large lot residential",
    minLotSize: 35000,
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

  "R1-18": {
    code: "R1-18",
    name: "Single-Family (18,000 sf)",
    description: "Medium-large lot",
    minLotSize: 18000,
    maxLotCoverage: 35,
    maxBuildingHeight: 30,
    setbacks: { front: 30, rear: 30, side: 10, streetSide: 20 },
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

  "R1-10": {
    code: "R1-10",
    name: "Single-Family (10,000 sf)",
    description: "Standard single-family",
    minLotSize: 10000,
    maxLotCoverage: 40,
    maxBuildingHeight: 30,
    setbacks: { front: 25, rear: 25, side: 7, streetSide: 15 },
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

  "R1-7": {
    code: "R1-7",
    name: "Single-Family (7,000 sf)",
    description: "Medium lot single-family",
    minLotSize: 7000,
    maxLotCoverage: 45,
    maxBuildingHeight: 30,
    setbacks: { front: 20, rear: 20, side: 5, streetSide: 10 },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 10000,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
      notes: ["Lot too small for ADU (10,000 sf minimum in unincorporated Maricopa County)"],
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 3, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "RURAL-43": {
    code: "RURAL-43",
    name: "Rural (1 acre min)",
    description: "Agricultural/rural residential",
    minLotSize: 43560,
    maxLotCoverage: 20,
    maxBuildingHeight: 30,
    setbacks: { front: 50, rear: 50, side: 25, streetSide: 40 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1200,
      minLotSizeSqFt: 10000,
      setbacks: { front: 50, rear: 20, side: 20, streetSide: 30 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
      notes: ["Rural zoning allows agricultural uses", "Guest houses common"],
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 40, setbackRear: 20, setbackSide: 20, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "RURAL-70": {
    code: "RURAL-70",
    name: "Rural (1.6 acre min)",
    description: "Low density rural",
    minLotSize: 70000,
    maxLotCoverage: 15,
    maxBuildingHeight: 30,
    setbacks: { front: 60, rear: 60, side: 30, streetSide: 50 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1200,
      minLotSizeSqFt: 10000,
      setbacks: { front: 60, rear: 25, side: 25, streetSide: 40 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: { setbackFromProperty: 15, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 50, setbackRear: 25, setbackSide: 25, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "RURAL-190": {
    code: "RURAL-190",
    name: "Rural (4.4 acre min)",
    description: "Very low density rural/ranch",
    minLotSize: 190000,
    maxLotCoverage: 10,
    maxBuildingHeight: 30,
    setbacks: { front: 75, rear: 75, side: 50, streetSide: 60 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1500,
      minLotSizeSqFt: 10000,
      setbacks: { front: 75, rear: 30, side: 30, streetSide: 50 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
      notes: ["Ranch-style properties", "Multiple guest houses may be allowed"],
    },
    pool: { setbackFromProperty: 20, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 60, setbackRear: 30, setbackSide: 30, maxHeightDetached: 20 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },
};

export function getZoningByCode(code: string): ZoningDistrict | null {
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');
  return maricopaCountyZoning[normalizedCode] || null;
}

export default maricopaCountyZoning;
