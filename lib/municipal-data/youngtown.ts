// lib/municipal-data/youngtown.ts
// Youngtown, AZ Municipal Zoning Database
// Note: Smallest incorporated town in AZ, retirement community

import type { ZoningDistrict } from './phoenix';

export const youngtownZoning: Record<string, ZoningDistrict> = {

  "R1-8": {
    code: "R1-8",
    name: "Single-Family (8,000 sf)",
    description: "Standard single-family",
    minLotSize: 8000,
    maxLotCoverage: 40,
    maxBuildingHeight: 25,
    setbacks: { front: 20, rear: 20, side: 5, streetSide: 15 },
    adu: {
      allowed: true,
      maxSizeSqFt: 800,
      minLotSizeSqFt: 8000,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
      notes: ["Youngtown - smallest incorporated town in AZ, retirement community"],
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
    maxBuildingHeight: 25,
    setbacks: { front: 20, rear: 15, side: 5, streetSide: 10 },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 8000,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
      notes: ["Lot too small for ADU (8,000 sf minimum in Youngtown)"],
    },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 3, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R-2": {
    code: "R-2",
    name: "Two-Family Residential",
    description: "Duplex housing",
    minLotSize: 6000,
    maxLotCoverage: 50,
    maxBuildingHeight: 25,
    setbacks: { front: 20, rear: 15, side: 5, streetSide: 10 },
    adu: { allowed: false, maxSizeSqFt: 0, minLotSizeSqFt: 0, setbacks: { front: 0, rear: 0, side: 0 }, parking: 0, requiresOwnerOccupancy: false },
    pool: { setbackFromProperty: 5, setbackFromHouse: 5, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 20, setbackRear: 5, setbackSide: 5, maxHeightDetached: 15 },
    permits: { buildingExemptUnder: 200, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },
};

export function getZoningByCode(code: string): ZoningDistrict | null {
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');
  return youngtownZoning[normalizedCode] || null;
}

export default youngtownZoning;
