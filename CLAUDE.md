# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rezio is a preconstruction platform for residential builders, contractors, and homeowners. It provides AI-powered project intake ("Scout"), parcel data integration (Regrid API), property visualization with mapping tools, and automated requirement/task generation for construction projects.

**Stack:** Next.js 15.5.4 (App Router), React 19, TypeScript, Prisma 6 (PostgreSQL), NextAuth 5.0 (JWT), Anthropic Claude SDK, OpenAI GPT-4, Leaflet/Mapbox maps

---

## Development Commands

```bash
# Start development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run linter
npm run lint

# Database operations
npx prisma generate          # Generate Prisma client after schema changes
npx prisma db push           # Push schema changes to database
npx prisma studio            # Open Prisma Studio GUI
npm run db:seed              # Seed database with initial data (tsx seed.ts)
```

**Database Connection:** PostgreSQL at `localhost:5432/rezio_dev` (see prisma/schema.prisma:7)

---

## Architecture & Key Patterns

### 1. Authentication Flow

- **NextAuth 5.0** with JWT strategy (not database sessions)
- Credentials provider with bcryptjs password hashing
- Session available via `await auth()` from `@/lib/auth`
- **Pattern:** All protected API routes start with:
  ```typescript
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  ```

### 2. Database Layer (Prisma)

**Core Models:**
- `User` - Profile with role (HOMEOWNER/BUILDER/DEVELOPER/ARCHITECT/ENGINEER)
- `Project` - Central entity linked to parcel, tasks, notes, files, shapes
- `Parcel` - Property data (APN, coordinates, zoning, lot size from Regrid API)
- `DrawnShape` - Map drawings (polygons/buildings) with GeoJSON coordinates, area, perimeter
- `Task` - Project-scoped todos with status/priority
- `MunicipalRequirement`, `RequirementRule`, `Jurisdiction` - Rules engine for permit requirements

**Common Patterns:**
```typescript
// Each route creates own Prisma instance
const prisma = new PrismaClient()

// Include relations when fetching
const project = await prisma.project.findUnique({
  where: { id },
  include: { parcel: true, tasks: true, drawnShapes: true }
})

// Upsert pattern (create or update)
await prisma.parcel.upsert({
  where: { apn },
  create: { ... },
  update: { ... }
})

// Cascading deletes with transactions
await prisma.$transaction(async (tx) => {
  await tx.task.deleteMany({ where: { projectId } })
  await tx.project.delete({ where: { id: projectId } })
})
```

### 3. API Route Patterns

**Key Routes:**
- `GET /api/projects/[id]` - Fetch project with relations
- `POST /api/projects/[id]/fetch-parcel` - Auto-fetch parcel data from Regrid, link to project
- `POST /api/projects/[id]/shapes` - Create drawn shape (building footprint, ADU, garage)
- `PATCH /api/projects/[id]/shapes/[shapeId]` - Update shape properties
- `POST /api/ai-scope/smart-scout` - Conversational AI project intake (Claude)
- `POST /api/ai-scope/create-project` - Parse Scout conversation, create project + tasks
- `POST /api/parcels/fetch` - Regrid lookup by address, upsert parcel

**Error Handling:**
- Try-catch blocks with `NextResponse.json({ error }, { status })`
- Status codes: 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)

### 4. AI Integration

**Two AI Systems:**

**A. Claude (Anthropic SDK) - Project Intake "Scout"**
- Location: `/app/api/ai-scope/` routes
- Model: `claude-sonnet-4-20250514`
- Progressive questioning flow: project type → size → structural → MEP → electrical
- Extracts structured JSON from conversation (see `/api/ai-scope/extract/route.ts`)
- Auto-generates tasks from requirements

**B. OpenAI GPT-4 - Project Analysis**
- Location: `/lib/ai.ts`
- Functions: `analyzeZoning()`, `generateProjectSuggestions()`, `analyzeProjectScope()`, `chatWithProjectAI()`
- Determines engineering requirements (Structural, Architectural, MEP, Civil, Soils, Survey)

### 5. Mapping & Spatial Features

**Libraries:**
- Leaflet 1.9.4 (primary), Leaflet Draw, Leaflet Editable
- Mapbox GL 3.15.0 / Maplibre GL 5.8.0 (basemaps)
- Google Maps API (address autocomplete)
- Turf.js 7.2.0 (area/perimeter calculations, geospatial operations)

**Main Component:** `PropertyVisualization.tsx`
- Renders parcel boundary polygon from coordinates
- Shows setback zones (front/rear/left/right adjustable)
- Drawing tools for shapes (house, garage, ADU, pool)
- Real-time area/perimeter calculations via Turf.js
- Saves shapes to `DrawnShape` table with GeoJSON coordinates

**Data Flow:**
```
Regrid API → Parcel boundary (GeoJSON) → Leaflet polygon
User draws shape → Turf.js calculates area/perimeter → POST /api/projects/[id]/shapes
```

### 6. Key Data Flows

**Project Creation (AI Scope → Project → Tasks):**
```
User enters address → Regrid search → Scout conversation (Claude AI)
→ Extract project data → Create Project + Parcel
→ Generate requirements (/lib/requirements.ts)
→ Auto-create Tasks → Dashboard
```

**Parcel Data Integration:**
```
Address input → /api/real-address-lookup → Regrid v1 Search API
→ Parse response (apn, zoning, coordinates, lot size)
→ Upsert Parcel (by APN) → Return parcel data
```

**Shape Drawing & Storage:**
```
PropertyVisualization → User draws on map → Leaflet Draw
→ Convert to GeoJSON → Turf.js calculates metrics
→ POST /api/projects/[id]/shapes → Save to drawnShapes table
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

3. **Imports:** Path alias `@/*` maps to project root (see tsconfig.json:22)

4. **Environment Variables:**
   - `ANTHROPIC_API_KEY` - Claude AI API key
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps
   - `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox basemaps
   - `REGRID_API_TOKEN` - Parcel data API
   - `NEXTAUTH_SECRET` - NextAuth JWT signing

5. **Prisma Client:** Generate after schema changes: `npx prisma generate`

6. **API Response Format:** Consistent JSON with status codes:
   ```typescript
   return NextResponse.json({ data }, { status: 200 })
   return NextResponse.json({ error: 'Not found' }, { status: 404 })
   ```

---

## Project Structure

```
app/
├── api/                    # API routes (Next.js App Router)
│   ├── ai-scope/          # Claude AI project intake (Scout)
│   ├── projects/[id]/     # Project CRUD, fetch-parcel, shapes
│   ├── parcels/           # Regrid integration (search, fetch, update)
│   ├── tasks/             # Task management
│   └── auth/              # NextAuth routes, signup
├── dashboard/             # Dashboard pages
├── projects/              # Project pages (list, detail, edit, new)
├── parcels/               # Parcel lookup pages
└── permits/               # Permit wizard

components/
├── PropertyVisualization.tsx  # Main mapping component (Leaflet + drawing)
├── InspectorPanel.tsx        # Shape property editor
├── MapToolbar.tsx            # Map controls
├── ProjectsDashboard.tsx     # Project list with search/filters
├── ProjectChat.tsx           # AI chat interface
└── ui/                       # Radix UI components (dialog, button, card, etc.)

lib/
├── auth.ts                # NextAuth configuration
├── ai.ts                  # OpenAI GPT-4 integration
├── requirements.ts        # Requirement generation logic
├── engineering.ts         # Engineering requirement rules
├── regrid.ts              # Regrid API client
└── utils.ts               # Utility functions

prisma/
└── schema.prisma          # Database schema (PostgreSQL)
```

---

## Working with Shapes & Mapping

**Creating a Shape:**
1. User draws on PropertyVisualization map
2. Component captures Leaflet Draw event
3. Calculate area/perimeter with Turf.js:
   ```typescript
   const area = turf.area(geoJson) * 10.7639  // Convert m² to sqft
   const perimeter = turf.length(geoJson, { units: 'feet' })
   ```
4. POST to `/api/projects/[id]/shapes` with:
   ```typescript
   {
     name: string,
     shapeType: 'polygon' | 'rectangle' | 'circle' | 'house' | 'garage' | 'adu',
     coordinates: GeoJSON,
     area: number,      // sqft
     perimeter: number, // feet
     properties: object // Optional: stories, height, etc.
   }
   ```

**Updating Shape Properties:**
- PATCH `/api/projects/[id]/shapes/[shapeId]` with partial update
- InspectorPanel component handles UI for property editing

---

## Working with AI Features

**Scout Conversation (Claude):**
- Endpoint: `/api/ai-scope/smart-scout`
- Send: `{ messages: Array<{role, content}>, address?: string }`
- Receive: `{ message: string, buttons?: Array, readyToCreate: boolean }`
- When `readyToCreate: true`, call `/api/ai-scope/create-project`

**Extract Project Data:**
- Endpoint: `/api/ai-scope/extract`
- Parses Scout conversation to extract structured JSON
- Returns: `{ fullAddress, projectType, squareFootage, stories, features, description }`

**GPT-4 Project Analysis:**
- Import from `@/lib/ai`
- `analyzeProjectScope(description)` → Returns engineering requirement flags
- `chatWithProjectAI(messages, projectContext)` → Context-aware chat

---

## Regrid API Integration

**Search by Address:**
```typescript
POST /api/parcels/search
Body: { query: "123 Main St, Phoenix, AZ" }
Returns: { address, apn, city, state, zoning, lotSize, coordinates }
```

**Fetch Full Parcel Data:**
```typescript
POST /api/parcels/fetch
Body: { apn: "123-45-678" }
Upserts Parcel in database, returns full parcel object
```

**Implementation:** See `/lib/regrid.ts` for API client wrapper

---

## Testing & Debugging

- **Development:** Run `npm run dev`, check console for errors
- **Database:** Use `npx prisma studio` to inspect/modify data
- **API Testing:** Use browser DevTools Network tab or Postman
- **Logs:** Check terminal for `console.log()` output from API routes
- **Common Issues:**
  - Missing `await params` in dynamic routes (Next.js 15 requirement)
  - Prisma client not generated after schema changes
  - Environment variables not set in `.env`
