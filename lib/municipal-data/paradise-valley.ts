// lib/municipal-data/paradise-valley.ts
// Paradise Valley, AZ Municipal Zoning Database
// Note: One of wealthiest cities in US, very strict zoning, no commercial

import type { ZoningDistrict } from './phoenix';

export const paradiseValleyZoning: Record<string, ZoningDistrict> = {

  "R-43": {
    code: "R-43",
    name: "Single-Family (1 acre)",
    description: "One acre minimum estate lots",
    minLotSize: 43560,
    maxLotCoverage: 25,
    maxBuildingHeight: 24,
    setbacks: { front: 50, rear: 40, side: 25, streetSide: 35 },
    adu: {
      allowed: true,
      maxSizeSqFt: 800,
      minLotSizeSqFt: 43560,
      setbacks: { front: 50, rear: 20, side: 15, streetSide: 30 },
      parking: 2,
      requiresOwnerOccupancy: true,
      maxHeight: 18,
      notes: ["Paradise Valley - one of wealthiest cities in US, very strict zoning", "ADUs require 1 acre minimum"],
    },
    pool: { setbackFromProperty: 10, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 40, setbackRear: 20, setbackSide: 15, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 120, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R-70": {
    code: "R-70",
    name: "Single-Family (70,000 sf / 1.6 acres)",
    description: "Large estate residential",
    minLotSize: 70000,
    maxLotCoverage: 20,
    maxBuildingHeight: 24,
    setbacks: { front: 60, rear: 50, side: 30, streetSide: 40 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 43560,
      setbacks: { front: 60, rear: 25, side: 20, streetSide: 35 },
      parking: 2,
      requiresOwnerOccupancy: true,
      maxHeight: 18,
      notes: ["Large estate lots with very strict design review"],
    },
    pool: { setbackFromProperty: 15, setbackFromHouse: 10, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 50, setbackRear: 25, setbackSide: 20, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 120, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },

  "R-100": {
    code: "R-100",
    name: "Single-Family (100,000 sf / 2.3 acres)",
    description: "Very large estate residential",
    minLotSize: 100000,
    maxLotCoverage: 15,
    maxBuildingHeight: 24,
    setbacks: { front: 75, rear: 60, side: 40, streetSide: 50 },
    adu: {
      allowed: true,
      maxSizeSqFt: 1200,
      minLotSizeSqFt: 43560,
      setbacks: { front: 75, rear: 30, side: 25, streetSide: 40 },
      parking: 2,
      requiresOwnerOccupancy: true,
      maxHeight: 18,
      notes: ["Largest estate lots in Paradise Valley", "Extensive design review required"],
    },
    pool: { setbackFromProperty: 20, setbackFromHouse: 15, requiresFence: true, fenceHeight: 5, permitRequired: true },
    garage: { setbackFront: 60, setbackRear: 30, setbackSide: 25, maxHeightDetached: 18 },
    permits: { buildingExemptUnder: 120, electricalAlwaysRequired: true, plumbingAlwaysRequired: true, reroof: false, hvacChangeout: false, waterHeater: false },
  },
};

export function getZoningByCode(code: string): ZoningDistrict | null {
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');
  return paradiseValleyZoning[normalizedCode] || null;
}

export default paradiseValleyZoning;
