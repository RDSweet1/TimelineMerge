# TimelineMerge - Decision Architecture

**Date:** 2025-11-01
**Architect:** Winston (with David)
**Project Level:** 2
**Methodology:** BMad Method - Scale Adaptive Architecture

---

## Executive Summary

TimelineMerge is a timeline-based inspection documentation tool built with Next.js 15, TypeScript, Tailwind CSS, ShadCN components, and Supabase. The architecture leverages modern web standards and a proven starter template to establish a solid foundation, with custom decisions focused on timeline performance, AI integration patterns, and consistent data management across distributed components.

**Architectural Approach:** Foundation from create-next-app starter + custom decisions for AI integration, timeline state management, and large-dataset handling.

---

## Project Initialization

The first implementation story should execute the following command to establish the base architecture:

```bash
npx create-next-app@latest timelinemerge --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**After project creation, run:**

```bash
cd timelinemerge
npx shadcn@latest init
```

During shadcn init, select:
- Style: **Default** (can customize colors via Tailwind config)
- Base color: **Slate** (matches UX Spec "Slate Calm" theme)
- CSS variables: **Yes** (enables dynamic theming)

**Then install Supabase packages:**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Install OpenAI SDK:**

```bash
npm install openai
```

**Install TanStack Query for state management:**

```bash
npm install @tanstack/react-query
npm install @tanstack/react-query-devtools --save-dev
```

**Install TanStack Virtual for timeline virtualization:**

```bash
npm install @tanstack/react-virtual
```

**Install dnd-kit for drag-and-drop:**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Install React PDF for report generation:**

```bash
npm install @react-pdf/renderer
```

---

## Starter Template Decisions

The create-next-app starter template provides these architectural decisions:

| Decision Category | Provided By Starter | Version/Details |
|------------------|---------------------|-----------------|
| Framework | Next.js | 15.5 (latest stable) |
| Language | TypeScript | Latest (configured by create-next-app) |
| App Architecture | App Router | Next.js App Router (vs. Pages Router) |
| Styling Foundation | Tailwind CSS | v4.x (with OKLCH color support) |
| Code Quality | ESLint | Configured with Next.js recommended rules |
| Project Structure | src/ directory | Code organized in `/src` folder |
| Import Aliases | @/* | Cleaner imports: `@/components/...` |
| Build Tooling | Turbopack | Next.js 15's default build system |

**Additional Setup (Manual):**
- **Component Library:** ShadCN/ui (installed via `shadcn init`)
- **Database:** Supabase (installed via npm packages)
- **AI Integration:** OpenAI SDK (to be installed)

---

## Decision Summary

_This section will be populated as we make architectural decisions._

| Category | Decision | Version | Affects Epics | Rationale |
|----------|----------|---------|---------------|-----------|
| Framework | Next.js | 15.5 | All | Starter template - modern React framework with SSR/SSG |
| Language | TypeScript | Latest | All | Starter template - type safety, better IDE support |
| Styling | Tailwind CSS | v4.x | All | Starter template + UX spec requirement |
| Component Library | ShadCN/ui | Latest | Epic 1, Epic 2 | UX spec requirement - accessible components |
| Database | Supabase | Latest | Epic 1, Epic 2 | PRD requirement - PostgreSQL with real-time features |
| AI Integration | OpenAI SDK + Server Actions | 6.1.0 | Epic 2 | Secure API calls for attribute extraction, modern Next.js pattern |
| Database Schema | Normalized with separate tables | Supabase PostgreSQL | Epic 1, Epic 2 | Project/Inspection hierarchy, separate tables per item type, polymorphic location attributes |
| Photo File Access | File System Access API | Browser native | Epic 1, Epic 2 | Direct access to local photos without upload/copy, modern browser support |
| State Management | TanStack Query (React Query) | 5.90.5 | Epic 1, Epic 2 | Server state sync, optimistic updates, auto-save, caching for timeline |
| Virtual Scrolling | TanStack Virtual | Latest | Epic 1, Epic 2 | Handle 3,000+ photos with dynamic heights, 60 FPS performance |
| AI Processing Pattern | Client-side batch processing | N/A | Epic 2 | Avoid Vercel serverless timeouts, real-time progress feedback |
| Database Access | Direct Supabase Client | Latest | Epic 1, Epic 2 | Standard Next.js + Supabase pattern via Server Actions |
| Drag-and-Drop | dnd-kit | Latest | Epic 2 | Modern, accessible, customizable for timeline reordering with visual feedback |
| Report Generation | @react-pdf/renderer | Latest | Epic 2 | React components for PDFs, server-side generation, complex layouts with photos |

---

## Data Architecture

### Entity Relationship Design

**Hierarchy:**
```
Projects (top level)
  └── Inspections (multiple per project)
        ├── Transcript Items
        ├── Photo Items
        └── Note Items
              └── Location Attributes (linked to each item)
```

### Database Schema

**1. projects**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**2. inspections**
```sql
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  inspection_date DATE,
  site_type_schema TEXT CHECK (site_type_schema IN ('commercial_v1', 'commercial_v2', 'residential')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inspections_project ON inspections(project_id);
```

**3. transcript_items**
```sql
CREATE TABLE transcript_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  index_position INTEGER NOT NULL,
  timestamp TIMESTAMPTZ,
  speaker_label TEXT,
  text_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inspection_id, index_position)
);

CREATE INDEX idx_transcript_inspection ON transcript_items(inspection_id);
CREATE INDEX idx_transcript_index ON transcript_items(inspection_id, index_position);
```

**4. photo_items**
```sql
CREATE TABLE photo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  index_position INTEGER NOT NULL,
  timestamp TIMESTAMPTZ,
  file_path TEXT NOT NULL,
  caption TEXT,
  exif_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inspection_id, index_position)
);

CREATE INDEX idx_photo_inspection ON photo_items(inspection_id);
CREATE INDEX idx_photo_index ON photo_items(inspection_id, index_position);
```

**5. note_items**
```sql
CREATE TABLE note_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  index_position INTEGER NOT NULL,
  note_type TEXT CHECK (note_type IN ('header', 'footer', 'free_floating')),
  associated_item_id UUID,
  associated_item_type TEXT CHECK (associated_item_type IN ('transcript', 'photo')),
  text_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inspection_id, index_position)
);

CREATE INDEX idx_note_inspection ON note_items(inspection_id);
CREATE INDEX idx_note_index ON note_items(inspection_id, index_position);
```

**6. location_attributes**
```sql
CREATE TABLE location_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('transcript', 'photo', 'note')),
  building TEXT,
  floor TEXT,
  unit TEXT,
  room TEXT,
  monitor_point TEXT,
  extraction_confidence DECIMAL(3,2),
  is_inherited BOOLEAN DEFAULT FALSE,
  manually_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_location_item ON location_attributes(item_id, item_type);
```

**7. Unified Timeline View**
```sql
CREATE VIEW timeline_items AS
  SELECT
    id,
    inspection_id,
    index_position,
    timestamp,
    'transcript' as item_type,
    text_content as content,
    speaker_label,
    NULL as file_path,
    NULL as caption
  FROM transcript_items

  UNION ALL

  SELECT
    id,
    inspection_id,
    index_position,
    timestamp,
    'photo' as item_type,
    caption as content,
    NULL as speaker_label,
    file_path,
    caption
  FROM photo_items

  UNION ALL

  SELECT
    id,
    inspection_id,
    index_position,
    NULL as timestamp,
    'note' as item_type,
    text_content as content,
    NULL as speaker_label,
    NULL as file_path,
    NULL as caption
  FROM note_items

  ORDER BY index_position;
```

**Key Schema Decisions:**
- **Project/Inspection Hierarchy:** Supports multiple inspections per project
- **Separate Item Tables:** Each item type (transcript, photo, note) has dedicated table with specific fields
- **Unique Index Positions:** Each item has exactly one position per inspection (enforced by database constraint)
- **Polymorphic Location Attributes:** Single table links to any item type via `item_id` + `item_type`
- **Timeline View:** Database view unions all items for efficient querying
- **Site Type at Inspection Level:** Each inspection can use different attribute schema

---

## Cross-Cutting Concerns

### Error Handling Strategy

**Server Actions Pattern:**

All Server Actions MUST return structured result objects (never throw to client):

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Example usage
async function saveTimelineItem(item: TimelineItem): Promise<ActionResult<TimelineItem>> {
  try {
    const result = await supabase.from('transcript_items').insert(item);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('[Timeline] Failed to save item:', {
      itemId: item.id,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return { success: false, error: 'Failed to save timeline item' };
  }
}
```

**Client-Side Error Handling:**

- **TanStack Query handles retries automatically** (3 retries with exponential backoff)
- **Display errors via ShadCN Toast component** (user-friendly messages)
- **Never expose technical details to users** (e.g., "Failed to save item" not "PostgreSQL constraint violation")

**Error Boundaries:**

- Wrap major sections (Timeline View, Import Screen) with React Error Boundaries
- Graceful degradation: show "Something went wrong" with refresh option
- Log errors for debugging

### Logging Strategy

**Structured Console Logging:**

All logging MUST follow this structured format for consistency:

```typescript
// Success logging (development only)
console.log('[ModuleName] Action description:', {
  relevantData,
  timestamp: new Date().toISOString()
});

// Error logging (all environments)
console.error('[ModuleName] Error description:', {
  context,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});

// Performance logging (development only)
console.time('[Timeline] Render 3000 items');
// ... operation ...
console.timeEnd('[Timeline] Render 3000 items');
```

**Module Name Conventions:**
- `[Timeline]` - Timeline-related operations
- `[Import]` - Import transcript/photos
- `[AI]` - OpenAI API calls
- `[DB]` - Database operations
- `[Report]` - Report generation
- `[Auth]` - Authentication (future)

**Log Levels:**
- `console.log()` - Informational (development only, strip in production)
- `console.warn()` - Warnings (potential issues)
- `console.error()` - Errors (always logged)

**Production Logging:**
- Vercel automatically captures all console output
- View logs in Vercel Dashboard → Project → Logs
- Error logs persisted for debugging
- Consider adding Sentry in future for advanced error tracking

### Performance Monitoring

**Key Metrics to Track:**
- Timeline render time with 3,000+ items
- Photo loading/display performance
- AI extraction batch processing time
- Database query performance

**Monitoring Approach:**
- Use `console.time()`/`console.timeEnd()` during development
- Monitor Vercel Analytics for page load times
- TanStack Query DevTools for data fetching performance
- Browser DevTools Performance tab for rendering issues

---

## Project Structure

**Complete source tree** (generated by create-next-app with customizations):

```
timelinemerge/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout with TanStack Query Provider
│   │   ├── page.tsx                  # Home page / Project list
│   │   ├── projects/
│   │   │   ├── [projectId]/
│   │   │   │   ├── page.tsx          # Project detail / Inspection list
│   │   │   │   └── inspections/
│   │   │   │       └── [inspectionId]/
│   │   │   │           ├── page.tsx  # Timeline view (main workspace)
│   │   │   │           ├── import/
│   │   │   │           │   └── page.tsx  # Import transcript/photos
│   │   │   │           └── report/
│   │   │   │               └── page.tsx  # Report preview/generate
│   │   ├── api/                      # API routes (minimal - prefer Server Actions)
│   │   └── globals.css               # Global styles
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # ShadCN components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...                   # Other ShadCN components
│   │   │
│   │   ├── timeline/                 # Timeline-specific components
│   │   │   ├── TimelineCard.tsx      # Base card component
│   │   │   ├── TranscriptCard.tsx    # Transcript variant
│   │   │   ├── PhotoCard.tsx         # Photo variant
│   │   │   ├── NoteCard.tsx          # Note variant
│   │   │   ├── PlaceholderDivider.tsx  # Note insertion zones
│   │   │   ├── LocationBadge.tsx     # Location attribute badges
│   │   │   ├── DragHandle.tsx        # Drag affordance
│   │   │   └── TimelineContainer.tsx # Virtual scrolling container
│   │   │
│   │   ├── import/                   # Import flow components
│   │   │   ├── TranscriptImporter.tsx
│   │   │   ├── PhotoImporter.tsx
│   │   │   ├── ImportProgress.tsx
│   │   │   └── SiteTypeSelector.tsx
│   │   │
│   │   ├── report/                   # Report generation components
│   │   │   ├── ReportPreview.tsx
│   │   │   ├── ReportDocument.tsx    # React PDF document
│   │   │   └── ReportGenerator.tsx
│   │   │
│   │   └── shared/                   # Shared components
│   │       ├── ErrorBoundary.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── PhotoLightbox.tsx
│   │
│   ├── lib/                          # Core business logic
│   │   ├── supabase/
│   │   │   ├── client.ts             # Supabase client initialization
│   │   │   ├── server.ts             # Server-side Supabase client
│   │   │   └── types.ts              # Database types (generated)
│   │   │
│   │   ├── ai/
│   │   │   ├── openai-client.ts      # OpenAI SDK initialization
│   │   │   ├── attribute-extractor.ts  # Location extraction logic
│   │   │   └── prompts.ts            # AI prompts for extraction
│   │   │
│   │   ├── timeline/
│   │   │   ├── reorder.ts            # Index recalculation logic
│   │   │   ├── inheritance.ts        # Attribute inheritance logic
│   │   │   └── merge.ts              # Merge transcript + photo items
│   │   │
│   │   ├── import/
│   │   │   ├── transcript-parser.ts  # Parse Otter.ai transcripts
│   │   │   ├── photo-scanner.ts      # Scan directory, extract EXIF
│   │   │   └── file-system.ts        # File System Access API wrapper
│   │   │
│   │   ├── report/
│   │   │   ├── pdf-generator.ts      # React PDF document builder
│   │   │   └── formatters.ts         # Data formatters for report
│   │   │
│   │   └── utils/
│   │       ├── date.ts               # Date formatting utilities
│   │       ├── validation.ts         # Input validation
│   │       └── errors.ts             # Error types and helpers
│   │
│   ├── actions/                      # Server Actions
│   │   ├── timeline.ts               # Timeline CRUD operations
│   │   ├── import.ts                 # Import operations
│   │   ├── ai.ts                     # AI extraction actions
│   │   ├── report.ts                 # Report generation
│   │   └── projects.ts               # Project/inspection management
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useTimeline.ts            # TanStack Query hooks for timeline
│   │   ├── useImport.ts              # Import state management
│   │   ├── usePhotoAccess.ts         # File System API hooks
│   │   └── useDragAndDrop.ts         # dnd-kit integration
│   │
│   └── types/                        # TypeScript types
│       ├── timeline.ts               # Timeline item types
│       ├── location.ts               # Location attribute types
│       ├── import.ts                 # Import types
│       └── api.ts                    # API response types
│
├── public/                           # Static assets
│   └── (no photos - photos stay in original locations)
│
├── supabase/                         # Supabase migrations and config
│   ├── migrations/
│   │   └── 001_initial_schema.sql    # Database schema SQL
│   └── config.toml
│
├── .env.local                        # Environment variables (gitignored)
│   # NEXT_PUBLIC_SUPABASE_URL=
│   # NEXT_PUBLIC_SUPABASE_ANON_KEY=
│   # OPENAI_API_KEY=
│
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS config (Slate Calm theme)
├── tsconfig.json                     # TypeScript configuration
├── components.json                   # ShadCN configuration
└── package.json                      # Dependencies
```

---

## Epic to Architecture Mapping

**Epic 1: Project Foundation & Data Import**

Maps to these architectural components:

| Story | Primary Module | Files/Components |
|-------|----------------|------------------|
| 1.1: Project Setup | Root | package.json, next.config.js, tailwind.config.ts |
| 1.2: Database Foundation | `lib/supabase/`, `supabase/migrations/` | client.ts, 001_initial_schema.sql |
| 1.3: Transcript Import | `lib/import/`, `actions/import.ts` | transcript-parser.ts, TranscriptImporter.tsx |
| 1.4: Photo Metadata Import | `lib/import/`, `actions/import.ts` | photo-scanner.ts, PhotoImporter.tsx |
| 1.5: Item List Data Model | `lib/timeline/`, `actions/timeline.ts` | merge.ts, timeline queries |
| 1.6: Item List Display | `components/timeline/`, `app/projects/[projectId]/inspections/[inspectionId]/page.tsx` | TimelineCard variants, TimelineContainer.tsx |

**Epic 2: AI Context Extraction & Timeline Management**

Maps to these architectural components:

| Story | Primary Module | Files/Components |
|-------|----------------|------------------|
| 2.1: Site Type Schema | `lib/supabase/`, database | Schema configuration in Supabase |
| 2.2: OpenAI Integration | `lib/ai/`, `actions/ai.ts` | openai-client.ts, attribute-extractor.ts |
| 2.3: Attribute Inheritance | `lib/timeline/inheritance.ts` | Inheritance calculation logic |
| 2.4: Manual Attribute Management | `components/timeline/`, `actions/timeline.ts` | Attribute editing UI, CRUD operations |
| 2.5: Item Editing & CRUD | `components/timeline/`, `actions/timeline.ts` | Inline editing, delete operations |
| 2.6: Drag & Drop Reordering | `components/timeline/`, `lib/timeline/reorder.ts`, `hooks/useDragAndDrop.ts` | dnd-kit integration, index recalculation |
| 2.7: Notes System | `components/timeline/NoteCard.tsx`, `actions/timeline.ts` | Note CRUD, placeholder insertion |
| 2.8: Report Generation | `lib/report/`, `components/report/`, `actions/report.ts` | pdf-generator.ts, ReportDocument.tsx |
| 2.9: Low-Confidence Flagging | `lib/ai/`, `components/timeline/` | Confidence thresholds, visual indicators |
| 2.10: AI Text Enhancement | `lib/ai/`, `actions/ai.ts` | Text enhancement prompts, comparison UI |

---

## Integration Points

**Key interfaces between modules:**

1. **Timeline ↔ Database**
   - Timeline components read from TanStack Query cache
   - Server Actions write to Supabase
   - Timeline view queries unified `timeline_items` VIEW

2. **Import ↔ AI Extraction**
   - Import flow triggers batch AI processing
   - Client sends batches to Server Actions
   - Server Actions call OpenAI, save to database

3. **Timeline ↔ Drag-and-Drop**
   - TimelineContainer wraps dnd-kit provider
   - Individual cards are draggable/sortable
   - On drop: update index positions, trigger Server Action

4. **Timeline ↔ Photo Access**
   - PhotoCard requests photo via File System API
   - Browser serves photos directly from user's filesystem
   - No backend involvement in photo display

5. **Report ↔ Timeline Data**
   - Report generation reads from database (not UI state)
   - React PDF components mirror timeline card structure
   - Generated server-side via Server Action

---

## Implementation Patterns

**These patterns ensure consistent implementation across all AI agents.**

### Naming Conventions

**Files and Folders:**
- React components: `PascalCase.tsx` (e.g., `TimelineCard.tsx`)
- Utilities/libs: `kebab-case.ts` (e.g., `attribute-extractor.ts`)
- Server Actions: `kebab-case.ts` (e.g., `timeline.ts`)
- Hooks: `camelCase.ts` starting with `use` (e.g., `useTimeline.ts`)
- Types: `kebab-case.ts` (e.g., `timeline.ts`)
- Folders: `kebab-case` (e.g., `import/`, `timeline/`)

**Variables and Functions:**
- Variables: `camelCase` (e.g., `inspectionId`, `timelineItems`)
- Functions: `camelCase` (e.g., `extractAttributes`, `reorderItems`)
- React components: `PascalCase` (e.g., `TimelineCard`, `PhotoImporter`)
- TypeScript types/interfaces: `PascalCase` (e.g., `TimelineItem`, `LocationAttributes`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `MAX_BATCH_SIZE`, `AI_CONFIDENCE_THRESHOLD`)

**Database Conventions:**
- Tables: `snake_case`, plural (e.g., `transcript_items`, `location_attributes`)
- Columns: `snake_case` (e.g., `inspection_id`, `index_position`)
- Enum values: `snake_case` (e.g., `'commercial_v1'`, `'free_floating'`)

### Component Structure Pattern

**ALL React components MUST follow this structure:**

```typescript
// 1. Imports (grouped: React, external libraries, internal)
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { TimelineItem } from '@/types/timeline';
import { getTimelineItems } from '@/actions/timeline';

// 2. Types/Interfaces (component-specific)
interface TimelineCardProps {
  item: TimelineItem;
  onDelete?: (id: string) => void;
}

// 3. Component (export at definition)
export function TimelineCard({ item, onDelete }: TimelineCardProps) {
  // 3a. Hooks (useState, useQuery, etc.)
  const [isEditing, setIsEditing] = useState(false);

  // 3b. Derived state / computations
  const formattedDate = formatDate(item.timestamp);

  // 3c. Event handlers
  const handleDelete = () => {
    if (onDelete) onDelete(item.id);
  };

  // 3d. JSX return
  return (
    <div className="timeline-card">
      {/* Component markup */}
    </div>
  );
}

// 4. Helper functions (file-private, below component)
function formatDate(date: Date): string {
  return date.toLocaleDateString();
}
```

### Server Action Pattern

**ALL Server Actions MUST follow this pattern:**

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { ActionResult } from '@/types/api';
import { TimelineItem } from '@/types/timeline';

export async function saveTimelineItem(
  item: TimelineItem
): Promise<ActionResult<TimelineItem>> {
  try {
    // 1. Initialize Supabase client
    const supabase = createClient();

    // 2. Validate input
    if (!item.inspection_id || !item.text_content) {
      return {
        success: false,
        error: 'Missing required fields'
      };
    }

    // 3. Perform operation
    const { data, error } = await supabase
      .from('transcript_items')
      .insert(item)
      .select()
      .single();

    // 4. Handle errors
    if (error) {
      console.error('[DB] Failed to save timeline item:', {
        itemId: item.id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return {
        success: false,
        error: 'Failed to save item'
      };
    }

    // 5. Return success
    return { success: true, data };

  } catch (error) {
    console.error('[Timeline] Unexpected error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}
```

### Database Query Patterns

**Consistent query structure:**

```typescript
// ALWAYS use select() to specify columns
const { data, error } = await supabase
  .from('transcript_items')
  .select('id, text_content, timestamp')
  .eq('inspection_id', inspectionId)
  .order('index_position', { ascending: true });

// For single record, use .single()
const { data, error } = await supabase
  .from('inspections')
  .select('*')
  .eq('id', id)
  .single();

// ALWAYS check for errors
if (error) {
  console.error('[DB] Query failed:', { error: error.message });
  return { success: false, error: 'Database query failed' };
}
```

### TanStack Query Hook Pattern

**Consistent custom hook structure:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTimelineItems, saveTimelineItem } from '@/actions/timeline';

export function useTimeline(inspectionId: string) {
  const queryClient = useQueryClient();

  // Query for fetching data
  const { data, isLoading, error } = useQuery({
    queryKey: ['timeline', inspectionId],
    queryFn: () => getTimelineItems(inspectionId),
  });

  // Mutation for updating data
  const saveItem = useMutation({
    mutationFn: saveTimelineItem,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['timeline', inspectionId] });
    },
  });

  return {
    items: data?.data || [],
    isLoading,
    error,
    saveItem: saveItem.mutate,
  };
}
```

### TypeScript Type Patterns

**Type definitions MUST match database schema:**

```typescript
// Database types (generated from Supabase)
export interface TranscriptItem {
  id: string;
  inspection_id: string;
  index_position: number;
  timestamp: string | null;
  speaker_label: string | null;
  text_content: string;
  created_at: string;
  updated_at: string;
}

// UI-specific types (extend database types)
export interface TranscriptItemWithAttributes extends TranscriptItem {
  location_attributes: LocationAttributes | null;
}

// Action result type (ALWAYS use this for Server Actions)
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### Import/Export Patterns

**Consistent import order:**

```typescript
// 1. React imports
import { useState, useEffect } from 'react';

// 2. External library imports (alphabetical)
import { useQuery } from '@tanstack/react-query';
import { useSortable } from '@dnd-kit/sortable';

// 3. Internal imports - UI components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Internal imports - custom components
import { TimelineCard } from '@/components/timeline/TimelineCard';

// 5. Internal imports - hooks
import { useTimeline } from '@/hooks/useTimeline';

// 6. Internal imports - actions
import { saveTimelineItem } from '@/actions/timeline';

// 7. Internal imports - types
import { TimelineItem } from '@/types/timeline';

// 8. Internal imports - utils
import { formatDate } from '@/lib/utils/date';
```

**Export patterns:**

```typescript
// Prefer named exports (easier to refactor)
export function TimelineCard() { }
export const formatDate = () => { }

// Avoid default exports except for page components
// app/page.tsx
export default function HomePage() { }
```

### Styling Patterns

**Tailwind CSS usage:**

```typescript
// Use Tailwind classes directly (NO CSS modules)
<div className="flex items-center gap-md p-lg bg-surface border border-border rounded-md shadow-sm">
  <span className="text-primary font-semibold">Content</span>
</div>

// Use custom spacing scale (6px base)
// xs: 6px, sm: 12px, md: 18px, lg: 24px, xl: 36px

// Use semantic color tokens
// primary: #475569, accent: #3b82f6, success: #10b981, error: #ef4444

// Conditional classes with clsx/cn utility
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  "more-classes"
)}>
```

### Date and Time Handling

**Consistent date formatting:**

```typescript
// ALWAYS store dates in ISO 8601 format in database
const timestamp = new Date().toISOString(); // "2025-11-01T12:30:00.000Z"

// Use consistent date formatter utility
import { formatDate, formatTime } from '@/lib/utils/date';

const displayDate = formatDate(timestamp); // "Nov 1, 2025"
const displayTime = formatTime(timestamp); // "12:30 PM"

// NO inline date formatting - use utilities for consistency
```

### AI Prompt Patterns

**Consistent prompt structure for OpenAI:**

```typescript
// lib/ai/prompts.ts
export const EXTRACT_ATTRIBUTES_PROMPT = `
You are analyzing inspection transcript text to extract location attributes.

Extract the following attributes from the text:
- building: The building name or identifier
- floor: The floor level
- unit: The unit or apartment number
- room: The specific room name
- monitor_point: Specific inspection point

Return JSON format:
{
  "building": "string or null",
  "floor": "string or null",
  "unit": "string or null",
  "room": "string or null",
  "monitor_point": "string or null",
  "confidence": 0.0-1.0
}

Text: {{transcript_text}}
`;

// Usage in attribute-extractor.ts
const prompt = EXTRACT_ATTRIBUTES_PROMPT.replace(
  '{{transcript_text}}',
  text
);
```

### Consistency Rules Summary

**MUST follow these rules:**

| Category | Rule | Example |
|----------|------|---------|
| Component files | PascalCase.tsx | `TimelineCard.tsx` |
| Utility files | kebab-case.ts | `attribute-extractor.ts` |
| Database tables | snake_case, plural | `transcript_items` |
| React components | Export at definition | `export function TimelineCard() {}` |
| Server Actions | Return ActionResult<T> | `Promise<ActionResult<Item>>` |
| Errors | Never throw to client | Return `{ success: false, error: "..." }` |
| Logging | Structured with [Module] | `console.error('[Timeline] Error:', {...})` |
| Dates | ISO 8601 in database | `2025-11-01T12:30:00.000Z` |
| Styling | Tailwind only, no CSS modules | `className="flex gap-md"` |
| Imports | Alias @/* for all internal | `import { X } from '@/lib/utils'` |

---

## Deployment Architecture

**Target Platform:** Vercel (optimized for Next.js)

**Deployment Strategy:**

```
┌─────────────────────────────────────────────┐
│  Vercel (Next.js Hosting)                   │
│  ├── Static Pages (SSG)                     │
│  ├── Server Components (SSR)                │
│  ├── Server Actions (Serverless Functions)  │
│  └── Edge Middleware (if needed)            │
└─────────────────────────────────────────────┘
         │
         ├──────────────> Supabase (Database + Auth)
         │                ├── PostgreSQL Database
         │                └── Row Level Security
         │
         └──────────────> OpenAI API (AI Extraction)
                          └── GPT-4 or GPT-3.5-Turbo
```

**Environment Variables (Required):**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=auto
```

**Deployment Checklist:**

1. ✅ Push code to GitHub repository
2. ✅ Connect Vercel to GitHub repo
3. ✅ Configure environment variables in Vercel dashboard
4. ✅ Deploy to preview environment (automatic on PR)
5. ✅ Test import flow, AI extraction, timeline reordering
6. ✅ Deploy to production (merge to main)
7. ✅ Run Supabase migrations to create database schema
8. ✅ Monitor Vercel logs for errors

**Estimated Costs (Monthly):**

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| Vercel | Hobby | $0 | Generous free tier, upgrade to Pro ($20/mo) if needed |
| Supabase | Free | $0 | 500MB database, 2GB bandwidth (sufficient for MVP) |
| OpenAI API | Pay-per-use | ~$10-50 | Depends on usage (GPT-3.5-Turbo recommended for cost) |
| **Total (MVP)** | | **~$10-50/mo** | Can stay on free tiers initially |

---

## Architecture Decision Records (ADRs)

### ADR-001: Next.js Server Actions over API Routes

**Decision:** Use Next.js Server Actions for all backend operations instead of traditional API routes.

**Rationale:**
- Simpler code: No need to create separate API route files
- Type safety: Direct TypeScript integration between client and server
- Modern Next.js pattern: Recommended by Vercel for Next.js 13+
- Secure by default: Server-only code, no risk of exposing secrets

**Consequences:**
- All backend logic must use `'use server'` directive
- TanStack Query wraps Server Actions for state management
- Debugging requires understanding Server Component lifecycle

**Affects:** Epic 1, Epic 2 (all backend operations)

---

### ADR-002: Normalized Database with Separate Tables

**Decision:** Use separate tables for each item type (transcript, photo, note) instead of a single polymorphic table.

**Rationale:**
- Type safety: Each table has specific columns for its item type
- Schema clarity: Easier to understand and maintain
- Query performance: Separate indexes per table type
- Flexibility: Easy to add item-type-specific fields

**Consequences:**
- Must query multiple tables and merge in application (or use VIEW)
- Created `timeline_items` VIEW to simplify queries
- Index position uniqueness enforced per table

**Affects:** Epic 1 (data model), Epic 2 (all timeline operations)

---

### ADR-003: Client-Side Batch Processing for AI Extraction

**Decision:** Process AI extraction in small client-controlled batches rather than long-running background jobs.

**Rationale:**
- Vercel serverless timeout constraints (10-60 seconds)
- Real-time progress feedback for users
- No additional services needed (no job queue)
- Simple to implement and debug

**Consequences:**
- Browser must stay open during import
- Batch size limited to ~10 items per Server Action call
- Progress bar required for user feedback
- Retry logic needed for failed batches

**Affects:** Epic 2 (Story 2.2 - OpenAI Integration)

---

### ADR-004: File System Access API for Photos

**Decision:** Use browser's File System Access API to read photos directly from user's filesystem instead of uploading.

**Rationale:**
- No storage costs: Photos stay in original location
- Faster import: No file upload required
- Matches workflow: Inspectors don't want to duplicate 3,000+ photos
- Modern browser support: Chrome, Edge, Firefox

**Consequences:**
- Requires modern browser (show compatibility message)
- Directory permission prompt on first use
- Photos not accessible server-side (reports must generate on client or reference by path)
- Handle permission revocation gracefully

**Affects:** Epic 1 (Story 1.4 - Photo Import), Epic 2 (Photo display in timeline)

---

### ADR-005: TanStack Query for State Management

**Decision:** Use TanStack Query (React Query) for all server state management instead of zustand or plain React state.

**Rationale:**
- Built for server state: Perfect for Supabase + Server Actions pattern
- Optimistic updates: Essential for auto-save and drag-and-drop UX
- Automatic caching: Timeline loads instantly on revisit
- Retry logic: Handles network failures automatically

**Consequences:**
- All data fetching must go through TanStack Query hooks
- QueryClient provider required in app layout
- DevTools helpful for debugging cache state
- Learning curve for developers unfamiliar with React Query

**Affects:** Epic 1, Epic 2 (all data operations)

---

## Development Environment Setup

**Prerequisites:**
- Node.js 20.9 or later
- npm or pnpm
- Modern browser (Chrome, Edge, Firefox)
- Git

**Setup Steps:**

```bash
# 1. Clone repository
git clone <repo-url>
cd timelinemerge

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and OpenAI keys

# 4. Initialize shadcn/ui
npx shadcn@latest init
# Select: Default style, Slate base color, CSS variables: Yes

# 5. Set up Supabase (optional for local dev)
npx supabase init
npx supabase start
npx supabase db push

# 6. Run development server
npm run dev
# Open http://localhost:3000
```

---

## Validation Summary

**Architecture Completeness Checklist:**

✅ **Decision Table:** Complete with versions and epic mapping
✅ **Project Structure:** Full source tree defined with no placeholders
✅ **Epic Mapping:** Every epic/story mapped to specific modules
✅ **Functional Requirements:** All FRs from PRD have architectural support
✅ **Non-Functional Requirements:** All NFRs addressed (performance, browser support, data volume)
✅ **Implementation Patterns:** Comprehensive patterns to prevent agent conflicts
✅ **Cross-Cutting Concerns:** Error handling, logging, monitoring defined
✅ **Integration Points:** All module interfaces documented
✅ **Deployment Strategy:** Vercel deployment with cost estimates
✅ **ADRs:** Key decisions documented with rationale

**Architectural Coherence:**

✅ All decisions work together (no conflicts)
✅ Technology choices align with project scale (Level 2)
✅ Patterns support auto-save requirements (TanStack Query + optimistic updates)
✅ Database schema supports all features (timeline, attributes, notes, reports)
✅ Performance requirements addressed (virtual scrolling, batch processing)
✅ Deployment feasible on selected platform (Vercel + Supabase)

---

## Next Steps

**For Story Implementation:**

1. **Story 1.1 (Project Setup):** Execute project initialization commands documented above
2. **Story 1.2 (Database Foundation):** Run Supabase migrations to create schema
3. **Subsequent Stories:** Reference this architecture for:
   - File placement (Project Structure section)
   - Naming conventions (Implementation Patterns section)
   - Code patterns (Component/Server Action patterns)
   - Integration points (Integration Points section)

**Important Reminders for AI Agents:**

- Always return `ActionResult<T>` from Server Actions (never throw)
- Use structured logging: `console.error('[Module] Message:', {...})`
- Follow import order: React → External → Internal (UI → Custom → Hooks → Actions → Types → Utils)
- Database dates in ISO 8601, display dates via utility functions
- Tailwind only, no CSS modules
- Component files: PascalCase.tsx, utilities: kebab-case.ts

---

_Generated by BMad Method - Decision Architecture Workflow v1.3.2_
_Architect: Winston (with David)_
_Date: 2025-11-01_
_Project: TimelineMerge (Level 2)_
