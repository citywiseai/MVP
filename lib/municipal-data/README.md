# Phoenix Municipal Zoning Database

TypeScript-based municipal zoning database for intelligent, code-compliant project guidance.

## Overview

This module provides comprehensive Phoenix zoning data including setbacks, ADU rules, permit thresholds, and project requirements. Integrated with Scout AI for intelligent project recommendations.

## Files

- **phoenix.ts** (852 lines) - Phoenix zoning districts and project type requirements
- **index.ts** - Module exports and jurisdiction management

## Zoning Districts

### Single-Family Residential
- R1-18 (18,000 sf lots)
- R1-14 (14,000 sf lots)
- R1-10 (10,000 sf lots) - Standard
- R1-8 (8,000 sf lots)
- R1-6 (6,000 sf lots)

### Multi-Family Residential
- R-2 (Duplex/Two-Family)
- R-3 (Apartments/Condos)
- R-3A (High Rise)
- R-4 (Medium High Rise)
- R-5 (Highest Density)

## Each District Includes

- **Lot Requirements**: Min size, max coverage, max height
- **Setbacks**: Front, rear, side, street-side (corner lots)
- **ADU Rules**: Allowed, max size, min lot size, setbacks, parking, height, notes
- **Pool Rules**: Setbacks, fence requirements, permits
- **Garage Rules**: Setbacks, max height for detached structures
- **Permit Thresholds**: Building, electrical, plumbing exemptions

## Project Types (13)

- ADU (detached, attached, conversion)
- Additions (bedroom, bathroom, room)
- Garage (new construction)
- Pool
- Remodels (kitchen, bathroom)
- Electrical panel upgrade
- Patio cover
- Block wall/fence

## Usage

```typescript
import {
  getZoningByCode,
  isADUAllowed,
  getProjectRequirements,
  validateSetbacks,
  getSmartHint
} from '@/lib/municipal-data/phoenix';

// Get zoning district info
const zoning = getZoningByCode('R1-10');
console.log(zoning.name); // "Single-Family Residential (10,000 sf)"
console.log(zoning.setbacks); // { front: 20, rear: 20, side: 5, streetSide: 15 }

// Check if ADU is allowed on a specific lot
const aduCheck = isADUAllowed(zoning, 8000);
// Returns: { allowed: true, maxSize: 1000 }

// Get project permit requirements
const requirements = getProjectRequirements('adu-detached');
console.log(requirements.permits); // ["Building", "Electrical", "Plumbing", "Mechanical"]
console.log(requirements.typicalTimeline); // "4-6 months"

// Validate structure setbacks
const validation = validateSetbacks(
  zoning,
  { front: 15, rear: 10, side: 5 },
  'adu'
);
// Returns: { valid: boolean, violations: string[] }

// Get smart contextual hints for Scout AI
const hint = getSmartHint(zoning, 'adu-detached', {
  lotSize: 10000,
  proposedSize: 800
});
// Returns formatted hint string for AI
```

## Scout AI Integration

Scout automatically uses this data when analyzing properties:

1. **Property Lookup** - Gets zoning code from Regrid/parcel data
2. **Zoning Rules** - Looks up rules using `getZoningByCode()`
3. **Lot-Specific Analysis** - Uses `isADUAllowed()` to check eligibility
4. **Contextual Guidance** - Provides code-compliant recommendations

## Helper Functions

### `getZoningByCode(code: string): ZoningDistrict | null`
Get zoning district by code. Handles variations like "R1-10" vs "R-1-10".

### `isADUAllowed(zoning, lotSize): { allowed, reason?, maxSize? }`
Check if ADU is permitted on a specific lot size.

### `getProjectRequirements(type): ProjectTypeRequirements | null`
Get permit requirements, inspections, timeline, and costs for a project type.

### `validateSetbacks(zoning, structure, type): { valid, violations[] }`
Validate if proposed setbacks meet code requirements.

### `getSmartHint(zoning, projectType, context): string`
Generate contextual hints for Scout AI based on zoning and project details.

## Data Sources

Based on:
- Phoenix Zoning Ordinance
- City of Phoenix Planning & Development Department
- Phoenix Municipal Code

## Future Enhancements

- Additional jurisdictions (Scottsdale, Tempe, Mesa, Chandler, Gilbert)
- Historic district overlays
- Special use permits
- Design guidelines
- HOA rule integration
