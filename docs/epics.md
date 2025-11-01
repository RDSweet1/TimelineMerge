# TimelineMerge - Epic Breakdown

**Author:** David
**Date:** 2025-10-31
**Project Level:** 2
**Target Scale:** Level 2 (2-5 epics, 15-40 stories)

---

## Overview

This document provides the detailed epic breakdown for TimelineMerge, expanding on the high-level epic list in the [PRD](./PRD.md).

Each epic includes:

- Expanded goal and value proposition
- Complete story breakdown with user stories
- Acceptance criteria for each story
- Story sequencing and dependencies

**Epic Sequencing Principles:**

- Epic 1 establishes foundational infrastructure and initial functionality
- Subsequent epics build progressively, each delivering significant end-to-end value
- Stories within epics are vertically sliced and sequentially ordered
- No forward dependencies - each story builds only on previous work

---

## Epic 1: Project Foundation & Data Import

**Expanded Goal:**
Establish the technical foundation for TimelineMerge and deliver core data import capabilities that allow users to bring Otter.ai transcripts and inspection photos into the system. This epic creates a working application that can ingest inspection data and display it in a basic ordered item list, providing immediate value and setting the stage for AI-powered features in Epic 2.

---

**Story 1.1: Project Setup & Infrastructure**

As a developer,
I want a fully configured Next.js project with TypeScript, Tailwind CSS, and ShadCN components,
So that I have a solid foundation to build TimelineMerge features.

**Acceptance Criteria:**
1. Execute project initialization command:
   ```bash
   npx create-next-app@latest timelinemerge --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   ```
2. Initialize ShadCN with specific configuration:
   ```bash
   npx shadcn@latest init
   ```
   - Style: Default
   - Base color: Slate
   - CSS variables: Yes
3. Install all required dependencies:
   ```bash
   npm install @supabase/supabase-js @supabase/ssr openai @tanstack/react-query @tanstack/react-query-devtools @tanstack/react-virtual @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @react-pdf/renderer
   ```
4. Add initial ShadCN components (Button, Card, Input, Toast)
5. Create `.env.local` file with environment variable template (no actual keys):
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   OPENAI_API_KEY=
   ```
6. Basic app shell with layout structure (app/layout.tsx, app/page.tsx)
7. Development environment runs locally without errors (`npm run dev`)
8. ESLint configured with Next.js recommended rules (from create-next-app)

**Prerequisites:** None

---

**Story 1.2: Database Foundation**

As a developer,
I want a Supabase database connected with a complete schema supporting projects, inspections, and timeline items,
So that I can store and retrieve inspection data in the proper hierarchical structure.

**Acceptance Criteria:**
1. Supabase project created and connected to Next.js application
2. Complete database schema created with all tables:
   - **projects** (id, name, client_name, created_at, updated_at)
   - **inspections** (id, project_id, name, inspection_date, site_type_schema, created_at, updated_at)
   - **transcript_items** (id, inspection_id, index_position, timestamp, speaker_label, text_content, created_at, updated_at)
   - **photo_items** (id, inspection_id, index_position, timestamp, file_path, caption, exif_data, created_at, updated_at)
   - **note_items** (id, inspection_id, index_position, note_type, associated_item_id, associated_item_type, text_content, created_at, updated_at)
   - **location_attributes** (id, item_id, item_type, building, floor, unit, room, monitor_point, extraction_confidence, is_inherited, manually_edited, created_at, updated_at)
   - **timeline_items VIEW** (unified view that unions all item types ordered by index_position)
3. UNIQUE constraints on (inspection_id, index_position) for all item tables to enforce ordering
4. Indexes created on inspection_id and index_position columns for performance
5. Database connection tested and verified from Next.js Server Actions
6. Environment variables properly configured for Supabase credentials in .env.local
7. Basic CRUD operations tested against all tables (create project, create inspection, create items)

**Prerequisites:** Story 1.1 (Project Setup)

---

**Story 1.3: Otter.ai Transcript Import**

As an inspector,
I want to import my Otter.ai transcript file,
So that spoken observations are captured as items in my inspection.

**Acceptance Criteria:**
1. User selects existing inspection or creates new inspection before import
2. File upload interface accepts .txt or .json transcript files from Otter.ai
3. Parser extracts timestamps, speaker labels, and text content from transcript
4. Transcript segments stored as individual items in database linked to selected inspection
5. Items receive index positions based on chronological timestamp order
6. Import success/failure feedback displayed to user
7. Handle parsing errors gracefully with clear error messages

**Prerequisites:** Story 1.2 (Database Foundation)

---

**Story 1.4: Photo Metadata Import**

As an inspector,
I want to import photos from a directory on my computer,
So that visual evidence is included in my inspection without moving the files.

**Acceptance Criteria:**
1. User selects existing inspection or creates new inspection before import
2. Directory selection interface allows user to choose photo folder (using File System Access API)
3. System scans selected directory and extracts EXIF metadata (timestamp, device, GPS if available)
4. Photo items stored in database linked to selected inspection with file path reference (files stay in original location)
5. Photo items receive index positions based on chronological timestamp order
6. Supported formats: JPG, JPEG, PNG
7. Import handles missing EXIF data gracefully (use file modification time as fallback)
8. Import success summary shows count of photos imported

**Prerequisites:** Story 1.2 (Database Foundation)

---

**Story 1.5: Item List Data Model**

As a developer,
I want a unified data model that merges transcript and photo items into a single ordered collection,
So that users can work with all inspection items as one cohesive list.

**Acceptance Criteria:**
1. Query/fetch all items for an inspection ordered by index position
2. Data model supports mixed item types (transcript, photo) in single ordered list
3. Timestamps preserved as metadata but index position controls display order
4. API endpoint returns unified item collection with proper typing
5. Support for reindexing items when order changes
6. Data structure supports future item types (notes) without schema changes

**Prerequisites:** Story 1.3 (Transcript Import), Story 1.4 (Photo Import)

---

**Story 1.6: Item List Display**

As an inspector,
I want to see all my imported transcripts and photos displayed in order,
So that I can review my inspection data in sequence.

**Acceptance Criteria:**
1. Navigation shows project → inspection → timeline hierarchy
2. Item list view renders all items for selected inspection in index order
3. Visual differentiation between transcript items (text display) and photo items (thumbnail + file info)
4. Transcript items show: timestamp, text content
5. Photo items show: thumbnail image, timestamp, file name
6. Click photo thumbnail opens full-size lightbox with keyboard navigation (arrow keys, Esc to close)
7. List scrolls smoothly with basic performance (handles 100+ items without lag)
8. Empty state shown when no items exist with prompt to import data
9. Basic styling using Tailwind and ShadCN components

**Prerequisites:** Story 1.5 (Item List Data Model)

---

## Epic 2: AI Context Extraction & Timeline Management

**Expanded Goal:**
Transform the basic item list into an intelligent, editable inspection documentation system. Implement AI-powered location attribute extraction that automatically identifies building, floor, unit, room, and monitor point context from natural speech patterns in transcripts. Enable full editing capabilities including item reordering, CRUD operations, and a flexible notes system. Complete the MVP by delivering report generation that produces client-ready inspection documentation.

---

**Story 2.1: Site Type Schema Configuration**

As a developer,
I want to define and store the three site type schemas with their attribute hierarchies,
So that the system can apply the correct location structure based on inspection type.

**Acceptance Criteria:**
1. Database schema supports site types: Commercial variant 1, Commercial variant 2, Residential
2. Each site type defines attribute hierarchy (e.g., building → floor → unit → room → monitor point)
3. Schema configuration stored and retrievable from database
4. UI allows user to select site type when creating/importing an inspection
5. Selected site type persists with inspection and controls attribute extraction behavior
6. Documentation of each schema's attribute hierarchy and usage

**Prerequisites:** Story 1.2 (Database Foundation)

---

**Story 2.2: OpenAI Integration & Attribute Extraction**

As an inspector,
I want the system to automatically extract location attributes from my transcript,
So that I don't have to manually tag every item with building, floor, room information.

**Acceptance Criteria:**
1. OpenAI API integration configured with environment variables (OPENAI_API_KEY)
2. System sends transcript text segments to OpenAI with structured prompts requesting location attribute extraction
3. Parser identifies location patterns (building, floor, unit, room, monitor point) from AI responses
4. Extracted attributes stored in database linked to transcript items with confidence scores
5. Extraction respects selected site type schema (only extracts relevant attributes)
6. Error handling for API failures with user-friendly messages
7. Rate limiting and cost control measures implemented
8. Large transcript imports processed in client-controlled batches (10 segments per Server Action call to avoid Vercel serverless timeout)
9. Real-time progress indicator displayed during batch processing (e.g., "Processing item 45 of 150...")
10. Batch failures handled gracefully with retry capability for failed batches
11. User can pause/resume long-running imports (optional but recommended for 40+ hour transcripts)

**Prerequisites:** Story 2.1 (Site Type Schema Configuration)

---

**Story 2.3: Attribute Inheritance System**

As an inspector,
I want location attributes to automatically apply to subsequent items until context changes,
So that I don't have to repeat the same location information for every photo and note.

**Acceptance Criteria:**
1. When attributes are assigned to an item (via AI or manual entry), subsequent items inherit those attributes
2. Inheritance continues down the item list until explicitly overridden
3. New items inserted into the list inherit attributes from the previous item
4. UI visually indicates inherited vs. explicitly set attributes
5. Attribute inheritance recalculates when items are reordered
6. System handles partial attribute changes (e.g., room changes but building/floor remain same)

**Prerequisites:** Story 2.2 (OpenAI Integration & Attribute Extraction)

---

**Story 2.4: Manual Attribute Management**

As an inspector,
I want to manually edit location attributes on any item,
So that I can correct AI mistakes or add attributes to items that don't have them.

**Acceptance Criteria:**
1. UI provides attribute editing interface for each item (inline or modal)
2. User can create, update, or delete any attribute on any item
3. Dropdown/autocomplete for attribute values based on site type schema
4. Manual edits override AI-extracted attributes
5. Attribute changes trigger inheritance recalculation for subsequent items
6. Visual indication when attributes have been manually edited vs. AI-extracted vs. inherited
7. Changes persist to database immediately

**Prerequisites:** Story 2.3 (Attribute Inheritance System)

---

**Story 2.5: Item Editing & CRUD Operations**

As an inspector,
I want to edit, delete, and modify items in my inspection,
So that I can correct transcript errors, remove unwanted items, and add photo captions.

**Acceptance Criteria:**
1. Transcript items: inline text editing with auto-save
2. Photo items: add/edit caption field
3. Delete any item with confirmation prompt
4. Deleted items removed from database and UI
5. Edit operations preserve item index position
6. Index positions automatically adjust when items are deleted
7. Undo capability for deletions (optional but recommended)

**Prerequisites:** Story 1.6 (Item List Display)

---

**Story 2.6: Drag & Drop Reordering**

As an inspector,
I want to drag and drop items to reorder them,
So that I can organize my inspection sequence exactly how I want it.

**Acceptance Criteria:**
1. Drag handle on each item for reordering
2. Visual feedback during drag operation (ghost image, drop zones, placeholder gaps)
3. Drop action updates item index positions in database
4. Attribute inheritance recalculates after reordering
5. Reordering works smoothly with 100+ items in list
6. Keyboard accessibility for reordering (move up/down buttons)
7. Mouse wheel navigation moves selected card incrementally up/down timeline
8. Optimistic UI updates with error rollback if save fails

**Prerequisites:** Story 2.3 (Attribute Inheritance System), Story 2.5 (Item Editing)

---

**Story 2.7: Notes System**

As an inspector,
I want to add notes to my inspection as header notes, footer notes, or free-floating notes,
So that I can add context, observations, and commentary throughout my documentation.

**Acceptance Criteria:**
1. Placeholder zones displayed before and after each card enable inline note creation
2. Click placeholder zone to instantly create note in that exact position (maintaining flow and spatial context)
3. UI provides "Add Note" functionality with type selection (header/footer/free-floating)
4. Header notes: associated with specific item, displayed before that item, move with item when reordered
5. Footer notes: associated with specific item, displayed after that item, move with item when reordered
6. Free-floating notes: independent items with their own index position, don't move with other items
7. Notes stored in database with item_type='note' and association metadata
8. Notes support rich text editing (bold, italic, lists)
9. Notes inherit location attributes like other items
10. Notes can be edited and deleted like other items

**Prerequisites:** Story 2.5 (Item Editing & CRUD Operations)

---

**Story 2.8: Report Generation**

As an inspector,
I want to generate a formatted inspection report from my item list,
So that I can deliver professional documentation to my clients.

**Acceptance Criteria:**
1. "Generate Report" button triggers report creation
2. Report includes all items in index order: transcripts, photos, notes
3. Each item displays: location attributes, timestamp (if applicable), content/caption
4. Photos rendered as images in report with captions
5. Notes formatted distinctly from transcript items
6. Report format: PDF or formatted HTML (at minimum)
7. Report preview before final generation
8. Report filename includes inspection date/identifier
9. Report saved/downloadable to user's computer

**Prerequisites:** Story 2.7 (Notes System)

---

**Story 2.9: Low-Confidence Flagging**

As an inspector,
I want the system to flag location attributes that were extracted with low confidence,
So that I can review and correct uncertain extractions.

**Acceptance Criteria:**
1. AI extraction process captures confidence scores from OpenAI responses
2. Items with confidence below threshold (e.g., 70%) are flagged in database
3. UI visually indicates flagged items (warning icon, highlight, badge)
4. Filter/view to show only flagged items for review
5. User can dismiss flags after manual review
6. Confidence score displayed when hovering over flagged items
7. Manual attribute edits automatically clear flags

**Prerequisites:** Story 2.4 (Manual Attribute Management)

---

**Story 2.10: AI Text Enhancement (Item-by-Item)**

As an inspector,
I want to request AI-powered enhancement of transcript or note text for individual items,
So that I can polish language and improve clarity while maintaining control over changes.

**Acceptance Criteria:**
1. "Enhance with AI" button/action available on transcript items and note items
2. User clicks to request enhancement for a single item
3. System sends item text to OpenAI with polishing/enhancement prompt
4. AI-suggested enhanced text displayed side-by-side with original
5. User can approve (replace original) or reject (keep original) the suggestion
6. Manual edits can be made to AI suggestion before approving
7. Original text preserved until user explicitly approves replacement
8. Enhancement works on both transcript text and notes
9. Visual indicator shows which items have been AI-enhanced
10. Error handling for API failures with clear messaging

**Prerequisites:** Story 2.5 (Item Editing & CRUD Operations), Story 2.7 (Notes System)

---

## Story Guidelines Reference

**Story Format:**

```
**Story [EPIC.N]: [Story Title]**

As a [user type],
I want [goal/desire],
So that [benefit/value].

**Acceptance Criteria:**
1. [Specific testable criterion]
2. [Another specific criterion]
3. [etc.]

**Prerequisites:** [Dependencies on previous stories, if any]
```

**Story Requirements:**

- **Vertical slices** - Complete, testable functionality delivery
- **Sequential ordering** - Logical progression within epic
- **No forward dependencies** - Only depend on previous work
- **AI-agent sized** - Completable in 2-4 hour focused session
- **Value-focused** - Integrate technical enablers into value-delivering stories

---

**For implementation:** Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown.
