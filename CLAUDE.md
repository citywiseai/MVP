# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CityWise** (formerly Rezio) is an enterprise preconstruction platform for residential builders, contractors, and homeowners. It provides AI-powered project intake, parcel data integration, property visualization with mapping, vendor/bid management, floor plan generation, Pizza Tracker-style roadmap system, and comprehensive audit logging.

**Stack:** Next.js 15.5.4 (App Router), React 19, TypeScript, Prisma 6 (PostgreSQL), NextAuth 5.0 (JWT), Anthropic Claude SDK (Sonnet 4.5), OpenAI GPT-4, Replicate AI, Leaflet/Mapbox maps, Puppeteer

---

## Development Commands

```bash
# Development server (localhost:3000)
npm run dev

# Build for production (runs prisma migrate deploy first)
npm run build

# Production server
npm start

# Linting
npm run lint

# Database operations
npx prisma generate          # Generate Prisma client after schema changes
npx prisma db push           # Push schema changes to database
npx prisma studio            # Open Prisma Studio GUI
npm run db:seed              # Seed database (runs seed-phoenix-zoning.ts)

# Database utilities
npm run fix-projects         # Fix data inconsistencies (dry run)
npm run fix-projects:commit  # Fix data inconsistencies (commit changes)

# Floor plan scraping & analysis
npm run scrape:betterplace   # Scrape BetterPlace ADU floor plans
npm run scrape:houseplans    # Scrape HousePlans.com
npm run analyze:betterplace  # Analyze floor plans with Claude Vision

# Generic scraper/analyzer CLI
npm run scrape               # Run scraper interactively
npm run analyze              # Run analyzer interactively
```

**Database Connection:** PostgreSQL at `localhost:5432/rezio_dev` (see prisma/schema.prisma)

---

## Architecture & Key Patterns

### 1. Authentication & Multi-Organization

**NextAuth 5.0** with JWT strategy (not database sessions)
- Credentials provider with bcryptjs password hashing
- Session available via `await auth()` from `@/lib/auth`
- Multi-organization support with `Org` and `Membership` models
- Auto-creates organization for new users

**Pattern:**
```typescript
const session = await auth()
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Projects belong to organizations
const project = await prisma.project.findFirst({
  where: {
    id: projectId,
    org: {
      memberships: {
        some: { userId: session.user.id }
      }
    }
  }
})
```

### 2. Database Layer (Prisma)

**Core Models:**

**Projects & Property:**
- `User` - Profile with role (HOMEOWNER/BUILDER/DEVELOPER/ARCHITECT/ENGINEER)
- `Org` / `Membership` - Multi-organization support with role-based access
- `Project` - Central entity with parcel, tasks, roadmap, vendors, floor plans
- `Parcel` - Property data (APN, coordinates, zoning, lot size from Regrid API)
- `DrawnShape` - Map drawings (polygons/buildings) with GeoJSON coordinates
- `Measurement` - Distance measurements on map
- `ProjectNote` - Notes and attachments

**Roadmap System (Pizza Tracker):**
- `ProjectRoadmap` - Container for 6-phase workflow
- `RoadmapPhase` - Discovery → Design → Engineering → Permit Submission → City Review → Approval
- Tasks linked to phases via `phaseId` foreign key
- Automatic phase assignment based on task keywords

**Vendor & Bid Management:**
- `Vendor` - Contractor database with trade, licensing, insurance expiry, ratings
- `Bid` - Proposals on tasks with pricing, timelines, payment tracking (unpaid/partial/paid)
- Tasks can have multiple bids; one accepted bid per task
- Payment tracking with amounts and dates

**Tasks & Requirements:**
- `Task` - Project-scoped todos with status/priority/category/estimatedCost
- `MunicipalRequirement` - Permit requirements (documents, regulations)
- `RequirementRule` - Conditional requirement triggers
- `Jurisdiction` - City/county permit processing data
- `PhoenixZoning` - Detailed zoning rules for Phoenix, AZ
- `PermitTimeline` - Jurisdiction-specific permit timelines

**Floor Plans:**
- `FloorPlan` - AI-generated or uploaded floor plans with metadata
- Linked to projects with sqft, beds, baths, imageUrl

**Audit & Compliance:**
- `ProjectAuditLog` - Track all project changes (creation, scope changes, field updates)
- Scope additions/removals with cascade deletion counts
- Source tracking (scout, manual, etc.)

**Temporary Data:**
- `ExplorationConversation` - Pre-project Scout chats (not yet committed to project)

**Common Patterns:**
```typescript
// Each route creates own Prisma instance
const prisma = new PrismaClient()

// Include relations when fetching
const project = await prisma.project.findUnique({
  where: { id },
  include: {
    parcel: true,
    tasks: { where: { isActive: true } },
    drawnShapes: true,
    roadmap: {
      include: {
        phases: {
          include: {
            tasks: true
          },
          orderBy: { order: 'asc' }
        }
      }
    },
    vendors: true,
    floorPlans: true
  }
})

// Upsert pattern (create or update)
await prisma.parcel.upsert({
  where: { apn },
  create: { ... },
  update: { ... }
})

// Transactions for cascading operations
await prisma.$transaction(async (tx) => {
  // Delete related entities first
  await tx.task.updateMany({
    where: { projectId },
    data: { isActive: false }
  })
  await tx.project.delete({ where: { id: projectId } })
})
```

### 3. API Route Architecture

**Project Routes:**
- `GET /api/projects/[id]` - Fetch project with relations
- `PATCH /api/projects/[id]` - Update project fields
- `DELETE /api/projects/[id]` - Delete project
- `POST /api/projects/[id]/fetch-parcel` - Auto-fetch parcel data from Regrid
- `POST /api/projects/[id]/shapes` - Create drawn shape (building footprint, ADU, garage)
- `PATCH /api/projects/[id]/shapes/[shapeId]` - Update shape properties
- `GET /api/projects/[id]/chat-history` - Fetch project chat messages
- `POST /api/projects/[id]/chat-history` - Save chat message
- `DELETE /api/projects/[id]/chat-history/[messageId]` - Delete message
- `POST /api/project-chat` - AI chat with project context

**Roadmap Routes (Pizza Tracker):**
- `GET /api/projects/[id]/roadmap` - Get project roadmap with phases and tasks
- `POST /api/projects/[id]/roadmap` - Create roadmap (auto-creates 6 phases)
- `PATCH /api/projects/[id]/roadmap/phase/[phaseId]` - Update phase status/progress
- `POST /api/projects/[id]/generate-roadmap` - Regenerate roadmap from tasks

**Vendor & Bid Routes:**
- `GET /api/vendors` - List all vendors
- `POST /api/vendors` - Create vendor
- `POST /api/tasks/[id]/bids` - Submit bid for task
- `GET /api/tasks/[id]/bids` - List bids for task
- `POST /api/bids/[id]/accept` - Accept bid (links to task)
- `PATCH /api/bids/[id]/payment` - Update payment status

**Floor Plan Routes:**
- `POST /api/generate-floorplan` - Generate with Replicate AI (pattern-based prompts)
- `POST /api/generate-floorplan-gemini` - Generate with Gemini Vision
- `GET /api/projects/[id]/floorplans` - List project floor plans
- `POST /api/floorplans` - Create/upload floor plan

**Task Routes:**
- `GET /api/projects/[id]/tasks` - List tasks
- `POST /api/projects/[id]/tasks` - Create task
- `PATCH /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

**Audit Routes:**
- `GET /api/projects/[id]/audit-logs` - Project change history

**Parcel Routes:**
- `POST /api/parcels/search` - Regrid search by address
- `POST /api/parcels/fetch` - Fetch full parcel data by APN
- `GET /api/real-address-lookup` - Real-time address lookup

**AI Intake Routes (Scout):**
- `POST /api/ai-scope/smart-scout` - Conversational AI project intake (Claude)
- `POST /api/ai-scope/create-project` - Parse Scout conversation, create project + tasks
- `POST /api/ai-scope/extract` - Extract structured data from conversation

**Municipal Data Routes:**
- `GET /api/municipal-requirements` - List requirements for jurisdiction
- `GET /api/permit-timeline` - Get jurisdiction permit timelines
- `GET /api/phoenix-zoning` - Phoenix-specific zoning rules

**Scope Management:**
- `POST /api/projects/[id]/scope-impact` - Analyze scope change impact (cascade deletion)

**Error Handling:**
- Try-catch blocks with `NextResponse.json({ error }, { status })`
- Status codes: 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)

### 4. AI Integration (Three Systems)

**A. Claude Sonnet 4.5 (Anthropic SDK) - Project Intake "Scout"**
- Location: `/app/api/ai-scope/` routes
- Model: `claude-sonnet-4-20250514`
- Progressive questioning flow: project type → size → structural → MEP → electrical
- Extracts structured JSON from conversation (see `/api/ai-scope/extract/route.ts`)
- Auto-generates tasks from requirements
- Integration with document checklist system (`/lib/documentChecklists.ts`)

**B. OpenAI GPT-4 - Project Analysis & Chat**
- Location: `/lib/ai.ts`
- Functions: `analyzeZoning()`, `generateProjectSuggestions()`, `analyzeProjectScope()`, `chatWithProjectAI()`
- Determines engineering requirements (Structural, Architectural, MEP, Civil, Soils, Survey)
- Context-aware chat with project data and document checklists

**C. Replicate AI - Floor Plan Generation**
- Location: `/app/api/generate-floorplan/route.ts`
- Pattern-based prompts derived from analysis of 30 professional ADU floor plans
- Size-specific layouts (400-500, 500-800, 800-1000, 1000+ sqft)
- Hybrid layouts (93% of professional designs): open living + separated bedrooms
- Central-hall circulation (63% of plans) for privacy
- Storage features: walk-in closets (57%), pantries (27%), dedicated laundry
- Efficiency patterns: back-to-back plumbing, galley kitchens for smaller units
- Enhanced negative prompts to prevent unrealistic layouts

**D. Claude Vision API - Floor Plan Analysis**
- Location: `/scripts/analyzer/analyze-floorplans.ts`
- Analyzes professional floor plans for patterns
- Extracts layout types, circulation patterns, storage features
- Dimensional observations and design insights

### 5. Pizza Tracker Roadmap System

**Overview:** Projects use a 6-phase "Pizza Tracker" style workflow with automatic task assignment and dynamic timeline calculation.

**Phases (in order):**
1. **Discovery** (2-4 weeks) - Site analysis, surveys, soils reports
2. **Design** (3-6 weeks) - Architectural plans, floor plans
3. **Engineering** (4-6 weeks) - Structural, MEP, civil, energy compliance
4. **Permit Submission** (1-2 weeks) - Package compilation, submittal
5. **City Review** (4-12 weeks) - Plan check, corrections, revisions
6. **Approval** (1-2 weeks) - Final permit issuance

**Database Structure:**
- `ProjectRoadmap` - One per project
- `RoadmapPhase` - 6 phases with order, status (waiting/in_progress/completed/delayed), progress (0-100%)
- Tasks linked via `phaseId` foreign key

**Automatic Task Assignment:**
Tasks auto-assigned to phases based on keyword matching (`/lib/phases.ts`):
- "survey", "soils" → Discovery
- "architectural", "design", "floor plan" → Design
- "structural", "electrical", "MEP", "engineering" → Engineering
- "permit package", "submittal" → Permit Submission
- "city review", "plan check", "corrections" → City Review
- "permit issuance", "approval" → Approval

**Timeline Calculation:**
`/lib/timelineCalculator.ts` provides:
- Business day calculations (excluding weekends)
- Dynamic duration based on vendor bid completion dates
- Jurisdiction-specific City Review timelines from `PermitTimeline` table
- Phase dependency tracking

**Pattern:**
```typescript
// Auto-create roadmap with 6 phases
const roadmap = await prisma.projectRoadmap.create({
  data: {
    projectId: project.id,
    phases: {
      create: PROJECT_PHASES.map((phase, i) => ({
        name: phase.name,
        order: i + 1,
        status: i === 0 ? 'in_progress' : 'waiting',
        estimatedDuration: phase.duration,
        services: [],
        dependencies: [],
        progress: 0
      }))
    }
  }
})

// Assign task to phase by keyword
import { suggestPhaseForTask } from '@/lib/phases'
const phaseOrder = suggestPhaseForTask(task.title) // Returns 1-6
await prisma.task.update({
  where: { id: task.id },
  data: { phaseId: phases[phaseOrder - 1].id }
})

// Calculate business days
import { addBusinessDays, getBusinessDaysBetween } from '@/lib/timelineCalculator'
const completionDate = addBusinessDays(new Date(), 30) // 30 business days from now
const duration = getBusinessDaysBetween(startDate, endDate)
```

### 6. Vendor & Bid Management

**Purpose:** Multi-vendor bidding on tasks with payment tracking and vendor database.

**Database Models:**
- `Vendor` - Trade, licensing, insurance expiry, phone, email, rating
- `Bid` - Task proposal with amount, estimatedCompletionDate, status, notes
- Payment tracking: `paymentStatus` (unpaid/partial/paid), `amountPaid`, `paymentDate`

**Workflow:**
1. Create vendor profile
2. Submit bid on task
3. Project owner reviews bids
4. Accept bid (links to task, sets `task.acceptedBidId`)
5. Track payment status as work progresses

**Pattern:**
```typescript
// Submit a bid
const bid = await prisma.bid.create({
  data: {
    taskId: task.id,
    vendorId: vendor.id,
    amount: 5000,
    estimatedCompletionDate: new Date('2026-03-15'),
    status: 'received',
    notes: 'Includes materials and labor'
  }
})

// Accept bid and link to task
await prisma.task.update({
  where: { id: task.id },
  data: {
    acceptedBidId: bid.id,
    vendorId: bid.vendorId,
    estimatedCost: bid.amount
  }
})

// Update payment status
await prisma.bid.update({
  where: { id: bid.id },
  data: {
    paymentStatus: 'partial',
    amountPaid: 2500,
    paymentDate: new Date()
  }
})
```

### 7. Audit Logging System

**Purpose:** Track all project changes for compliance and accountability.

**Database Model:** `ProjectAuditLog`

**Tracked Events:**
- `project_created` - Initial creation (source: scout or manual)
- `scope_added` - New scope item (ADU, pool, etc.)
- `scope_removed` - Removed scope with cascade deletion count
- `field_updated` - Any field change with before/after values

**Library:** `/lib/audit-logger.ts`

**Functions:**
- `logProjectCreation(projectId, details, createdBy)`
- `logScopeAddition(projectId, scopeItem, impact, createdBy)`
- `logScopeRemoval(projectId, scopeItem, impact, createdBy)`
- `logFieldUpdate(projectId, field, previousValue, newValue, createdBy)`

**Pattern - Scope Change with Cascade Deletion:**
```typescript
import { logScopeRemoval } from '@/lib/audit-logger'
import { getCategoriesForScopes } from '@/lib/scope-mapping'

// Remove ADU from scope
const categories = getCategoriesForScopes(['adu'])
const result = await prisma.task.updateMany({
  where: {
    projectId: project.id,
    category: { in: categories }
  },
  data: { isActive: false }
})

// Log the impact
await logScopeRemoval(
  project.id,
  'adu',
  {
    requirementsAffected: 0,
    tasksAffected: result.count
  },
  user.email
)
```

### 8. Floor Plan Intelligence System

**Overview:** Combines web scraping, AI analysis, and generation for professional floor plans.

**Components:**

**A. Floor Plan Scraper (`/scripts/scraper/`)**
- Puppeteer-based web scraping framework (`BaseScraper.ts`)
- BetterPlace Design+Build scraper (30+ ADU plans analyzed)
- Builder investigation (DR Horton, Lennar, KB Home)
- Rate limiting, image optimization, metadata extraction
- 100% success rate on BetterPlace ADUs

**B. Claude Vision Analyzer (`/scripts/analyzer/analyze-floorplans.ts`)**
- Pattern extraction from professional floor plans
- Layout classification (hybrid, open, traditional)
- Circulation analysis (central-hall, linear, open-flow)
- Storage and efficiency feature detection
- Generates comprehensive insights reports

**C. AI Floor Plan Generation (`/app/api/generate-floorplan/route.ts`)**
- Replicate API integration
- Pattern-based prompts from 30-plan analysis
- Size-specific layouts (400-500, 500-800, 800-1000, 1000+ sqft)
- Hybrid layouts (93% of professional designs)
- Walk-in closets (57% of plans, even in 400 sqft units)
- Central-hall circulation (63% of plans)
- Back-to-back bathroom plumbing (efficiency standard)
- Galley kitchens for 400-800 sqft units

**Key Insights Applied:**
- 93% of professional ADUs use hybrid layouts (open living + separated bedrooms)
- 63% use central-hall circulation for privacy
- 57% have walk-in closets (even in tiny units)
- 27% have dedicated pantries
- Back-to-back plumbing is standard efficiency pattern

**NPM Scripts:**
```bash
npm run scrape:betterplace    # Scrape BetterPlace ADUs (30 plans)
npm run analyze:betterplace   # Analyze with Claude Vision
```

**See:** `FLOOR-PLAN-SYSTEM-SUMMARY.md` for complete documentation.

### 9. Document Checklist System

**Library:** `/lib/documentChecklists.ts`

**Purpose:** Provide jurisdiction-specific document requirements for permit submission.

**Checklist Types:**
- Required documents (always needed)
- Conditional documents (based on project specifics)
- At-completion documents (post-construction)

**Project Types:**
- `ADDITION` - Residential additions
- `ADU` - Accessory dwelling units
- `NEW_CONSTRUCTION` - New homes
- `REMODEL` - Interior/exterior renovations

**Integration:**
Used in AI chat (`/lib/ai.ts`) to provide accurate document lists:
```typescript
import { getChecklist } from '@/lib/documentChecklists'
const checklist = getChecklist('ADU')
// Returns: { required: [], conditional: [], atCompletion: [] }
```

**Example Documents (ADU):**
- Required: Site plan, floor plans, elevations, structural calcs, electrical, plumbing, mechanical, energy compliance
- Conditional: Soils report (if poor soil), utility capacity letter, fire sprinkler, HOA approval
- At Completion: As-built drawings, final inspections, address assignment

### 10. Mapping & Spatial Features

**Libraries:**
- Leaflet 1.9.4 (primary), Leaflet Draw, Leaflet Editable
- Mapbox GL 3.16.0 / Maplibre GL 5.8.0 (basemaps)
- Google Maps API (address autocomplete)
- Turf.js 7.2.0 (area/perimeter calculations, geospatial operations)

**Main Component:** `PropertyVisualization.tsx` (alias: `MapboxPropertyVisualization.tsx`)
- Renders parcel boundary polygon from coordinates
- Shows setback zones (front/rear/left/right adjustable)
- Drawing tools for shapes (house, garage, ADU, pool)
- Real-time area/perimeter calculations via Turf.js
- Saves shapes to `DrawnShape` table with GeoJSON coordinates
- Edge labeling for parcel boundaries
- Assessor data integration with building sketches
- Distance measurements (`Measurement` model)

**Data Flow:**
```
Regrid API → Parcel boundary (GeoJSON) → Leaflet polygon
User draws shape → Turf.js calculates metrics → POST /api/projects/[id]/shapes
```

**Pattern - Creating a Shape:**
```typescript
// User draws on map, component calculates metrics
const area = turf.area(geoJson) * 10.7639  // m² to sqft
const perimeter = turf.length(geoJson, { units: 'feet' })

// POST to API
await fetch(`/api/projects/${projectId}/shapes`, {
  method: 'POST',
  body: JSON.stringify({
    name: 'Main House',
    shapeType: 'house',
    coordinates: geoJson,
    area,
    perimeter,
    properties: { stories: 2, height: 24 }
  })
})
```

### 11. Scope Change Management

**Purpose:** Intelligently cascade task deletion when project scope changes.

**Library:** `/lib/scope-mapping.ts`

**Functions:**
- `getCategoriesForScopes(scopes)` - Maps scope types to task categories
- `getEstimatedCostImpact(tasks)` - Calculates total cost of affected tasks

**Scope Types:**
- `adu`, `detachedAdu`, `attachedAdu`, `jadu`
- `addition`, `secondStory`
- `pool`, `spa`
- `kitchen`, `bathroom`
- `structuralChanges`, `foundationWork`
- `solarPanels`, `ev_charger`

**Pattern:**
```typescript
import { getCategoriesForScopes } from '@/lib/scope-mapping'
import { logScopeRemoval } from '@/lib/audit-logger'

// User removes ADU and pool from project
const removedScopes = ['adu', 'pool']
const categories = getCategoriesForScopes(removedScopes)

// Soft-delete related tasks
const result = await prisma.task.updateMany({
  where: {
    projectId: project.id,
    category: { in: categories }
  },
  data: { isActive: false }
})

// Log for audit trail
await logScopeRemoval(project.id, 'adu,pool', {
  tasksAffected: result.count,
  requirementsAffected: 0
}, user.email)
```

### 12. Key Data Flows

**Project Creation (Scout → Project → Roadmap → Tasks):**
```
User enters address → Regrid search → Scout conversation (Claude AI)
→ Extract project data → Create Project + Parcel + Org (if new user)
→ Generate requirements (/lib/requirements.ts)
→ Create ProjectRoadmap with 6 phases
→ Auto-create Tasks → Assign to phases by keyword
→ Dashboard with Pizza Tracker
```

**Vendor Bidding Flow:**
```
Task created → Multiple vendors submit bids
→ Project owner reviews bids (amount, timeline, vendor ratings)
→ Accept bid → Links bid to task (task.acceptedBidId)
→ Track payment status (unpaid → partial → paid)
→ Timeline automatically adjusts based on bid completion date
```

**Floor Plan Generation Flow:**
```
User requests floor plan → Enter specs (sqft, beds, baths)
→ System determines size category (400-500, 500-800, etc.)
→ Apply pattern-based prompt (hybrid layout, central-hall, walk-in closets, etc.)
→ Generate with Replicate AI → Save FloorPlan to database
→ Display in project gallery
```

**Scope Change with Audit Trail:**
```
User removes scope item (ADU) from project
→ getCategoriesForScopes(['adu']) → ['adu_plans', 'adu_foundation', etc.]
→ Soft-delete tasks in those categories (isActive: false)
→ logScopeRemoval() → ProjectAuditLog entry
→ Show audit history in project timeline
```

---

## Important Conventions

1. **Dynamic Route Params:** Always await params in App Router pages/routes:
   ```typescript
   export default async function Page({ params }: { params: Promise<{ id: string }> }) {
     const { id } = await params
   }
   ```

2. **Client Components:** Use `"use client"` directive for interactive components (maps, forms, dialogs)

3. **Imports:** Path alias `@/*` maps to project root (see tsconfig.json)

4. **Environment Variables:**
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - NextAuth JWT signing
   - `ANTHROPIC_API_KEY` - Claude Sonnet 4.5 (Scout, Vision)
   - `OPENAI_API_KEY` - GPT-4 (project analysis)
   - `REPLICATE_API_TOKEN` - Floor plan generation (optional)
   - `GEMINI_API_KEY` - Gemini floor plan generation (optional)
   - `REGRID_API_TOKEN` - Regrid parcel data API
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps autocomplete
   - `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox basemaps

5. **Prisma Client:**
   - Auto-generated on `npm install` (postinstall hook)
   - Regenerate after schema changes: `npx prisma generate`
   - Migrations run before build: `npm run build` → `prisma migrate deploy`

6. **API Response Format:** Consistent JSON with status codes:
   ```typescript
   return NextResponse.json({ data }, { status: 200 })
   return NextResponse.json({ error: 'Not found' }, { status: 404 })
   ```

7. **Business Days:** Always use business day calculations for timelines:
   ```typescript
   import { addBusinessDays, getBusinessDaysBetween } from '@/lib/timelineCalculator'
   const deadline = addBusinessDays(new Date(), 30) // Excludes weekends
   ```

8. **Soft Deletes:** Use `isActive: false` instead of hard deletes for tasks:
   ```typescript
   await prisma.task.updateMany({
     where: { projectId },
     data: { isActive: false }
   })
   ```

---

## Project Structure

```
app/
├── api/                              # API routes (Next.js App Router)
│   ├── ai-scope/                    # Claude AI project intake (Scout)
│   │   ├── smart-scout/             # Conversational intake
│   │   ├── create-project/          # Parse conversation, create project
│   │   └── extract/                 # Extract structured data
│   ├── projects/[id]/               # Project CRUD
│   │   ├── fetch-parcel/            # Regrid parcel data
│   │   ├── shapes/                  # Drawn shape management
│   │   ├── roadmap/                 # Roadmap with phases
│   │   ├── generate-roadmap/        # Regenerate from tasks
│   │   ├── tasks/                   # Task creation
│   │   ├── floorplans/              # Floor plan listing
│   │   ├── chat-history/            # Project chat messages
│   │   ├── audit-logs/              # Change history
│   │   └── scope-impact/            # Scope change analysis
│   ├── parcels/                     # Regrid integration
│   ├── tasks/[id]/                  # Task updates, bids
│   ├── vendors/                     # Vendor management
│   ├── bids/[id]/                   # Bid acceptance, payment
│   ├── floorplans/                  # Floor plan CRUD
│   ├── generate-floorplan/          # Replicate AI generation
│   ├── generate-floorplan-gemini/   # Gemini AI generation
│   ├── municipal-requirements/      # Permit requirements
│   ├── permit-timeline/             # Jurisdiction timelines
│   ├── phoenix-zoning/              # Phoenix-specific rules
│   ├── real-address-lookup/         # Address search
│   ├── project-chat/                # AI chat with project context
│   └── auth/                        # NextAuth routes, signup
├── dashboard/                       # Dashboard pages
├── projects/                        # Project pages (list, detail, edit)
│   └── [id]/
│       ├── page.tsx                 # Project detail with roadmap
│       ├── edit/                    # Edit project form
│       └── ProjectAuditHistory.tsx  # Audit log viewer
├── parcels/[id]/                    # Parcel detail pages
├── vendors/                         # Vendor management pages
└── permits/                         # Permit wizard

components/
├── MapboxPropertyVisualization.tsx  # Main mapping component (Leaflet)
├── PropertyVisualization.tsx        # Alias for above
├── InspectorPanel.tsx               # Shape property editor
├── MapToolbar.tsx                   # Map controls
├── ProjectsDashboard.tsx            # Project list with filters
├── ProjectChat.tsx                  # AI chat interface
├── ProjectChatWrapper.tsx           # Chat container with context
├── SmartScoutChat.tsx               # Scout intake chat
├── EditProjectModal.tsx             # Quick edit dialog
├── roadmap/
│   └── ProjectRoadmap.tsx           # Pizza Tracker UI
├── bids/                            # Bid submission/review components
├── vendors/                         # Vendor profile components
├── FloorPlanGallery.tsx             # Floor plan display
├── FloorPlanGenerator.tsx           # AI generation UI
├── ProjectTimeline.tsx              # Gantt chart timeline
├── CostSummary.tsx                  # Budget breakdown
├── ExportReportButton.tsx           # PDF report generation
├── PaymentModal.tsx                 # Payment tracking UI
└── ui/                              # Radix UI components (dialog, button, card)

lib/
├── auth.ts                          # NextAuth configuration
├── ai.ts                            # OpenAI GPT-4 integration
├── requirements.ts                  # Requirement generation logic
├── engineering.ts                   # Engineering requirement rules
├── regrid.ts                        # Regrid API client
├── phases.ts                        # Phase detection and task assignment
├── timelineCalculator.ts            # Business day calculations
├── documentChecklists.ts            # Permit document requirements
├── scope-mapping.ts                 # Scope-to-category mapping
├── audit-logger.ts                  # Audit logging functions
├── create-default-roadmap.ts        # Roadmap creation helper
├── phase-detector.ts                # Task-to-phase assignment
├── reportGenerator.ts               # PDF report generation
├── prisma.ts                        # Prisma client singleton
└── utils.ts                         # Utility functions

scripts/
├── scraper/                         # Floor plan scraping system
│   ├── BaseScraper.ts               # Scraper framework
│   ├── sources/
│   │   ├── BetterPlaceScraper.ts    # BetterPlace ADU scraper
│   │   └── HousePlansScraper.ts     # HousePlans.com scraper
│   └── run-scraper.ts               # CLI runner
├── analyzer/
│   └── analyze-floorplans.ts        # Claude Vision analyzer
├── fix-projects.ts                  # Data consistency fixer
├── list-projects.ts                 # List all projects
├── find-project.ts                  # Search for project
└── populate-*.ts                    # Database seeding scripts

prisma/
├── schema.prisma                    # Database schema (PostgreSQL)
└── seed-phoenix-zoning.ts           # Zoning data seeder

data/
└── floor-plans/
    ├── images/                      # Scraped floor plan images (gitignored)
    ├── metadata/                    # Floor plan metadata JSON (committed)
    └── analysis/                    # Claude Vision analysis results
```

---

## Working with Roadmap System

**Creating a Roadmap:**
```typescript
// Roadmap auto-created when project is created
// Can also manually create via API:
const roadmap = await fetch(`/api/projects/${projectId}/roadmap`, {
  method: 'POST'
})
// Creates 6 phases in order with default durations
```

**Assigning Tasks to Phases:**
```typescript
import { suggestPhaseForTask } from '@/lib/phases'

// Automatic assignment by keyword
const phaseOrder = suggestPhaseForTask('Structural engineering plans') // Returns 3 (Engineering)
const phase = await prisma.roadmapPhase.findFirst({
  where: { roadmapId, order: phaseOrder }
})

await prisma.task.update({
  where: { id: task.id },
  data: { phaseId: phase.id }
})
```

**Updating Phase Progress:**
```typescript
// Calculate progress based on completed tasks
const totalTasks = phase.tasks.length
const completedTasks = phase.tasks.filter(t => t.status === 'completed').length
const progress = Math.round((completedTasks / totalTasks) * 100)

await prisma.roadmapPhase.update({
  where: { id: phase.id },
  data: {
    progress,
    status: progress === 100 ? 'completed' : 'in_progress'
  }
})
```

**Timeline Calculation:**
```typescript
import { calculateProjectTimeline } from '@/lib/timelineCalculator'

// Calculates end date for each phase based on:
// - Phase estimated durations
// - Vendor bid completion dates
// - Jurisdiction permit timelines
// - Business days only
const timeline = calculateProjectTimeline(project, roadmap)
```

---

## Working with Vendors & Bids

**Creating a Vendor:**
```typescript
const vendor = await fetch('/api/vendors', {
  method: 'POST',
  body: JSON.stringify({
    name: 'ABC Construction',
    trade: 'General Contractor',
    licenseNumber: 'C-10 #123456',
    insuranceExpiry: new Date('2027-12-31'),
    phone: '555-0100',
    email: 'contact@abc.com',
    rating: 4.5
  })
})
```

**Submitting a Bid:**
```typescript
const bid = await fetch(`/api/tasks/${taskId}/bids`, {
  method: 'POST',
  body: JSON.stringify({
    vendorId: vendor.id,
    amount: 5000,
    estimatedCompletionDate: new Date('2026-03-15'),
    notes: 'Includes materials and labor for foundation work'
  })
})
```

**Accepting a Bid:**
```typescript
// Sets task.acceptedBidId and links vendor to task
await fetch(`/api/bids/${bidId}/accept`, { method: 'POST' })
```

**Tracking Payment:**
```typescript
await fetch(`/api/bids/${bidId}/payment`, {
  method: 'PATCH',
  body: JSON.stringify({
    paymentStatus: 'partial',
    amountPaid: 2500
  })
})
```

---

## Working with Floor Plans

**AI Generation:**
```typescript
const floorPlan = await fetch('/api/generate-floorplan', {
  method: 'POST',
  body: JSON.stringify({
    projectId,
    squareFootage: 800,
    bedrooms: 2,
    bathrooms: 2
  })
})
// System automatically applies pattern-based prompts based on size
// 800 sqft → Hybrid layout, central-hall circulation, galley kitchen, etc.
```

**Manual Upload:**
```typescript
const floorPlan = await fetch('/api/floorplans', {
  method: 'POST',
  body: JSON.stringify({
    projectId,
    imageUrl: 'https://...',
    squareFootage: 1200,
    bedrooms: 3,
    bathrooms: 2
  })
})
```

---

## Working with Audit Logs

**Logging Scope Changes:**
```typescript
import { logScopeRemoval, logScopeAddition } from '@/lib/audit-logger'

// When adding scope
await logScopeAddition(
  project.id,
  'pool',
  { requirementsAffected: 5, tasksAffected: 8 },
  user.email
)

// When removing scope
await logScopeRemoval(
  project.id,
  'adu',
  { requirementsAffected: 0, tasksAffected: 12 },
  user.email
)
```

**Fetching Audit History:**
```typescript
const logs = await fetch(`/api/projects/${projectId}/audit-logs`)
// Returns chronological list of all changes
```

---

## Testing & Debugging

- **Development:** Run `npm run dev`, check console for errors
- **Database:** Use `npx prisma studio` to inspect/modify data
- **API Testing:** Use browser DevTools Network tab or Postman
- **Logs:** Check terminal for `console.log()` output from API routes
- **Data Fixes:** Run `npm run fix-projects` (dry run) or `npm run fix-projects:commit` to fix inconsistencies
- **Common Issues:**
  - Missing `await params` in dynamic routes (Next.js 15 requirement)
  - Prisma client not generated after schema changes (run `npx prisma generate`)
  - Environment variables not set in `.env`
  - Roadmap phases not in correct order (check `order` field 1-6)
  - Tasks not assigned to phases (missing `phaseId`)
  - Business day calculations incorrect (use `timelineCalculator.ts` functions)

---

## Key Architectural Insights

1. **Pizza Tracker Roadmap** is the core workflow visualization - always ensure tasks are assigned to correct phases
2. **Vendor bidding** integrates with timeline calculations - accepted bids update phase completion dates
3. **Scope changes** must use cascade deletion via `scope-mapping.ts` to maintain data integrity
4. **Audit logging** is critical for compliance - log all significant changes
5. **Floor plan generation** uses insights from 30 professional plans - prompts are pattern-based, not generic
6. **Multi-organization support** requires checking org membership in all protected routes
7. **Business day calculations** are used throughout - never use calendar days for timelines
8. **Soft deletes** (isActive: false) preserve audit trail - don't hard delete tasks
9. **Document checklists** integrate with AI chat - always provide context-specific requirements
10. **Regrid parcel data** is cached in database - upsert by APN to avoid duplicates
