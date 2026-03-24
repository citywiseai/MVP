# BetterPlace ADU Floor Plans - Pattern Analysis Report

**Analyzed:** 30 professional ADU floor plans
**Date:** December 10, 2025
**Source:** BetterPlace Design+Build
**Method:** Claude Vision API pattern extraction

---

## Executive Summary

Analysis of 30 professionally-designed ADU floor plans reveals consistent design patterns optimized for small-space living (400-1200 sqft). The dominant approach is **hybrid layouts** (93%) combining open-concept living areas with separated, private bedrooms.

---

## Key Metrics

- **Average Size:** 764 sqft
- **Size Range:** 400 - 1200 sqft
- **Average Room Count:** 8 distinct spaces
- **Primary Layout:** Hybrid (open + separated) - 93%
- **Primary Circulation:** Central hall - 63%

---

## Layout Pattern Insights

### 1. Layout Types (How spaces relate)

| Layout Type | Count | % | Description |
|------------|-------|---|-------------|
| **Hybrid** | 28 | 93% | Open living/kitchen/dining + separated bedrooms |
| Traditional-Separated | 1 | 3% | All rooms separated with doors |
| Open-Concept | 1 | 3% | Fully open, minimal separation |

**Key Insight:** ADU designers overwhelmingly favor hybrid layouts to balance:
- Open, spacious feel in main living areas
- Privacy and quiet in sleeping areas
- Efficient use of limited square footage

### 2. Circulation Patterns (How people move)

| Circulation Type | Count | % | Description |
|-----------------|-------|---|-------------|
| **Central-Hall** | 19 | 63% | Traditional hallway connecting rooms |
| Open-Flow | 6 | 20% | Minimal hallways, open movement |
| Linear | 5 | 17% | Straight-line path through home |

**Key Insight:** Central hallways provide:
- Clear separation between public/private zones
- Efficient plumbing runs (bathrooms back-to-back)
- Sound privacy between bedrooms

---

## Storage Optimization Patterns

### Top 5 Storage Features

| Feature | Frequency | Usage Pattern |
|---------|-----------|---------------|
| **Walk-in Closets** | 17/30 (57%) | Even in 400-600 sqft units |
| **Pantry** | 8/30 (27%) | Dedicated pantry rooms vs closets |
| **Multiple Bedroom Closets** | 5/30 (17%) | Each bedroom gets closet |
| **Laundry Area** | 5/30 (17%) | Dedicated space, not in bathroom |
| **Kitchen Pantry Area** | 5/30 (17%) | Built-in pantry cabinets |

**Key Insight:** Successful small ADUs prioritize:
- Walk-in closets as standard (not just bedrooms > 800 sqft)
- Separate pantries even in tiny kitchens
- Dedicated laundry spaces (not bathroom corners)

---

## Space Efficiency Patterns

### Common Efficiency Strategies

1. **Back-to-Back Plumbing** (Most frequent)
   - Bathrooms share plumbing walls
   - Kitchen backs onto bathroom
   - Reduces plumbing costs and footprint

2. **Galley Kitchens** (400-800 sqft units)
   - Maximum counter space in minimal width
   - Efficient work triangle
   - Often 8-10 feet long

3. **Open Living-Dining** (Nearly universal)
   - Eliminates circulation space
   - Creates larger perceived volume
   - Flexible furniture arrangements

4. **Central Utility Core**
   - Bathroom + laundry clustered centrally
   - Efficient plumbing runs
   - Sound isolation from bedrooms

5. **Split Bedroom Layouts** (2+ bedroom units)
   - Master on one side, secondary bedrooms on other
   - Maximizes privacy
   - Reduces noise transfer

---

## Unique Design Features

### Standout Elements Found

1. **Angled Entry Walls** (3 plans)
   - Creates visual interest
   - Defines entry zone
   - Avoids direct sight-lines into living areas

2. **Dedicated Laundry Rooms** (4 plans)
   - Not closets - actual rooms with door
   - Space for folding, storage
   - Sound isolation

3. **Equal-Sized Bedrooms** (2 plans)
   - Both bedrooms same size
   - Flexible use (guest/office/child)
   - No "master" premium

4. **Kitchen Islands** (Larger units)
   - Integrated dishwasher
   - Additional storage
   - Workspace/eating surface

5. **Potential Loft Spaces** (1 plan)
   - Stairs to upper level
   - Expands perceived space
   - Flexible use (office/storage/guest)

---

## Dimensional Patterns

### Typical Room Sizes

**From Claude Vision dimension analysis:**

- **Bedrooms:** 9'6" - 11' wide, 10-12' deep
- **Bathrooms:** 5' - 7' wide (full bath)
- **Kitchen Width:** 8' - 12' (galley to L-shape)
- **Living Areas:** 12' - 16' wide combined
- **Hallway Width:** 3' - 3'6" typical

### Overall Footprints

- **400 sqft:** ~20' x 20' (square)
- **600 sqft:** ~24' x 25' (nearly square)
- **800 sqft:** ~28' x 28' OR 32' x 25'
- **1000 sqft:** ~30' x 33' OR 35' x 28'
- **1200 sqft:** ~32' x 37' OR 38' x 31'

**Key Insight:** ADUs favor square-ish proportions (1:1 to 1.3:1 ratio) to:
- Minimize exterior wall (cost savings)
- Maximize interior usability
- Reduce heating/cooling loads

---

## Recommendations for AI Floor Plan Generation

### 1. Update Base Prompts

**Current Issue:** AI generates too many open-concept plans

**Recommended Base Prompt:**
```
Professional ADU floor plan, hybrid layout with open living/kitchen/dining
and separated private bedrooms, central hallway circulation, back-to-back
bathroom plumbing, efficient galley kitchen, dedicated entry area
```

### 2. Add Specific Spatial Requirements

For different sizes:

**400-500 sqft (Studio/1BR):**
- Open living/kitchen/dining with minimal separation
- Murphy bed or sleeping alcove for 400 sqft
- Walk-in closet even in tiny units
- Galley kitchen 8-10' long
- Combined bath with washer/dryer

**600-800 sqft (1-2BR):**
- Central hallway separating public/private
- Galley or L-shaped kitchen with pantry
- Dedicated laundry area (not in bath)
- Walk-in closet in master
- Back-to-back bathrooms if 2 baths

**900-1200 sqft (2-3BR):**
- Split bedroom layout
- Kitchen island with integrated appliances
- Separate pantry room
- Dedicated laundry room with door
- Multiple walk-in closets

### 3. Emphasize Efficiency Features

Always include in prompts:
- "back-to-back plumbing for bathrooms"
- "galley kitchen for space efficiency"
- "open living-dining to minimize circulation"
- "central hallway for privacy and sound control"
- "walk-in closet even in compact plan"

### 4. Add Dimensional Constraints

Include typical proportions:
- "30' x 26' footprint for 780 sqft 2-bedroom"
- "bedroom width 9'6" to 11'"
- "hallway width 3' to 3'6""
- "bathroom depth 7' to 8'"

### 5. Specify Unique Features (Optional)

For variety, occasionally add:
- "angled entry wall for visual interest"
- "kitchen island with integrated dishwasher"
- "separate pantry room off kitchen"
- "dedicated laundry room with folding area"

---

## Size-Specific Prompt Templates

### 400 sqft Studio ADU

```
Simple 2D architectural floor plan, 400 square feet, studio ADU,
open-concept layout with sleeping alcove, galley kitchen 8' long,
full bathroom with washer/dryer, walk-in closet, dedicated entry area,
20' x 20' footprint, clean black lines on white background,
minimalist technical drawing, no furniture, professional blueprint style
```

### 750 sqft 2-Bedroom ADU

```
Simple 2D architectural floor plan, 750 square feet, 2 bedroom 1 bath ADU,
hybrid layout with open living/kitchen/dining and separated bedrooms,
central hallway circulation, split bedroom layout for privacy,
galley kitchen with pantry, back-to-back bathroom and laundry plumbing,
walk-in closet in master bedroom, 28' x 27' footprint,
clean black lines on white background, minimalist technical drawing,
no furniture, professional blueprint style, CAD drawing style
```

### 1000 sqft 3-Bedroom ADU

```
Simple 2D architectural floor plan, 1000 square feet, 3 bedroom 2 bath ADU,
hybrid layout with open living/kitchen/dining and separated bedrooms,
central hallway circulation, split bedroom layout,
L-shaped kitchen with island and separate pantry room,
back-to-back bathroom plumbing, dedicated laundry room,
walk-in closets in master and secondary bedroom,
31' x 32' footprint, clean black lines on white background,
minimalist technical drawing, no furniture, professional blueprint style
```

---

## Pattern-Based Negative Prompts

To avoid unrealistic AI generations, use these negative prompts:

```
3d render, realistic rendering, photograph, furniture,
decoration, colors, shading, gradient, perspective, isometric,
overly complex layout, excessive hallways, wasted circulation space,
disconnected rooms, poor flow, bedrooms off living room,
bathroom without hallway buffer, kitchen far from dining,
no storage, no closets, impractical room sizes,
bedrooms under 80 sqft, hallways over 4' wide
```

---

## Next Steps

1. **Update `/api/generate-floorplan/route.ts`** with new base prompts
2. **Create size-specific prompt variations** (400, 600, 800, 1000, 1200 sqft)
3. **Add pattern-based negative prompts** to prevent unrealistic layouts
4. **Test generation** with updated prompts
5. **Compare results** to professional BetterPlace designs
6. **Iterate** based on quality improvements

---

## Data Sources

- **Analysis Files:** `/data/floor-plans/analysis/betterplace/*.json`
- **Summary Report:** `/data/floor-plans/analysis/betterplace/summary-report.json`
- **Insights Summary:** `/data/floor-plans/analysis/betterplace/insights.json`
- **Floor Plan Images:** `/data/floor-plans/images/betterplace/`
- **Metadata:** `/data/floor-plans/metadata/betterplace/`

---

## Methodology

Each floor plan was analyzed using Claude Sonnet 4.5 Vision API with a structured prompt requesting:

1. Room count and types
2. Layout classification (open-concept, traditional-separated, hybrid)
3. Circulation pattern (linear, circular, central-hall, split, open-flow)
4. Entry type and kitchen location
5. Bedroom layout and bathroom placement
6. Storage features and efficiency notes
7. Unique features and dimensional observations

Results were aggregated to identify common patterns across all 30 professionally-designed ADU floor plans.

---

**Generated by:** Claude Code Floor Plan Analyzer
**Version:** 1.0.0
**Contact:** Review `/scripts/analyzer/analyze-floorplans.ts` for methodology
