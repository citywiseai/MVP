// lib/municipal-data/mesa.ts
// Mesa, AZ Municipal Zoning Database

import type { ZoningDistrict } from './phoenix';

export const mesaZoning: Record<string, ZoningDistrict> = {

  "RS-35": {
    code: "RS-35",
    name: "Single Residence (35,000 sf)",
    description: "Large lot single-family",
    minLotSize: 35000,
    maxLotCoverage: 30,
    maxBuildingHeight: 30,
    setbacks: {
      front: 30,
      rear: 25,
      side: 10,
      streetSide: 20,
    },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 30, rear: 10, side: 5, streetSide: 20 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: {
      setbackFromProperty: 5,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 25,
      setbackRear: 5,
      setbackSide: 5,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },

  "RS-15": {
    code: "RS-15",
    name: "Single Residence (15,000 sf)",
    description: "Medium-large lot single-family",
    minLotSize: 15000,
    maxLotCoverage: 35,
    maxBuildingHeight: 30,
    setbacks: {
      front: 25,
      rear: 20,
      side: 7,
      streetSide: 15,
    },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 25, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
    },
    pool: {
      setbackFromProperty: 5,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 20,
      setbackRear: 5,
      setbackSide: 5,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },

  "RS-9": {
    code: "RS-9",
    name: "Single Residence (9,000 sf)",
    description: "Standard single-family",
    minLotSize: 9000,
    maxLotCoverage: 40,
    maxBuildingHeight: 30,
    setbacks: {
      front: 20,
      rear: 20,
      side: 5,
      streetSide: 15,
    },
    adu: {
      allowed: true,
      maxSizeSqFt: 1000,
      minLotSizeSqFt: 6000,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 15 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 25,
      notes: ["Mesa is ADU-friendly with streamlined permitting"],
    },
    pool: {
      setbackFromProperty: 5,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 20,
      setbackRear: 5,
      setbackSide: 5,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },

  "RS-6": {
    code: "RS-6",
    name: "Single Residence (6,000 sf)",
    description: "Smaller lot single-family",
    minLotSize: 6000,
    maxLotCoverage: 45,
    maxBuildingHeight: 30,
    setbacks: {
      front: 20,
      rear: 15,
      side: 5,
      streetSide: 10,
    },
    adu: {
      allowed: true,
      maxSizeSqFt: 800,
      minLotSizeSqFt: 6000,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 10 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
    },
    pool: {
      setbackFromProperty: 5,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 20,
      setbackRear: 5,
      setbackSide: 3,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },

  "RM-2": {
    code: "RM-2",
    name: "Multi-Residence (Low Density)",
    description: "Duplexes and townhomes",
    minLotSize: 6000,
    maxLotCoverage: 50,
    maxBuildingHeight: 30,
    setbacks: {
      front: 20,
      rear: 15,
      side: 5,
      streetSide: 10,
    },
    adu: {
      allowed: true,
      maxSizeSqFt: 800,
      minLotSizeSqFt: 6000,
      setbacks: { front: 20, rear: 5, side: 5, streetSide: 10 },
      parking: 1,
      requiresOwnerOccupancy: false,
      maxHeight: 20,
    },
    pool: {
      setbackFromProperty: 5,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 20,
      setbackRear: 5,
      setbackSide: 5,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },

  "RM-3": {
    code: "RM-3",
    name: "Multi-Residence (Medium Density)",
    description: "Apartments and condos",
    minLotSize: 8000,
    maxLotCoverage: 55,
    maxBuildingHeight: 40,
    setbacks: {
      front: 20,
      rear: 20,
      side: 10,
      streetSide: 15,
    },
    adu: {
      allowed: false,
      maxSizeSqFt: 0,
      minLotSizeSqFt: 0,
      setbacks: { front: 0, rear: 0, side: 0 },
      parking: 0,
      requiresOwnerOccupancy: false,
    },
    pool: {
      setbackFromProperty: 10,
      setbackFromHouse: 5,
      requiresFence: true,
      fenceHeight: 5,
      permitRequired: true,
    },
    garage: {
      setbackFront: 20,
      setbackRear: 10,
      setbackSide: 10,
      maxHeightDetached: 15,
    },
    permits: {
      buildingExemptUnder: 200,
      electricalAlwaysRequired: true,
      plumbingAlwaysRequired: true,
      reroof: false,
      hvacChangeout: false,
      waterHeater: false,
    },
  },
};

export function getZoningByCode(code: string): ZoningDistrict | null {
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');
  return mesaZoning[normalizedCode] || null;
}

export default mesaZoning;
