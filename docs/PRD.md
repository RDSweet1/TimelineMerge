# TimelineMerge Product Requirements Document (PRD)

**Author:** David
**Date:** 2025-10-31
**Project Level:** 2
**Target Scale:** Level 2 (2-5 epics, 15-40 stories)

---

## Goals and Background Context

### Goals

- Replace the manual Word/PDF merging workflow with an automated timeline-based solution that eliminates copy-paste work
- Enable AI-powered location attribute extraction and timeline organization with 90%+ accuracy and minimal manual correction
- Generate professional, client-ready inspection reports directly from organized timeline data

### Background Context

Property damage inspectors currently face a significant workflow bottleneck in post-inspection documentation. After completing field inspections, they manually copy-paste Otter.ai transcript excerpts and photos into Word or PDF documents—a tedious, error-prone process that fails to preserve the critical chronological relationship between spoken observations and visual evidence. This manual merging consumes valuable time and introduces risks of misattribution or lost context.

TimelineMerge addresses this gap by introducing an intelligent timeline interface that automatically organizes transcript excerpts and photos chronologically while using AI to extract location attributes (building, floor, unit, room, monitor point) from natural speech patterns. By maintaining the temporal connection between spoken observations and photographs, and automating context extraction and inheritance, the tool transforms inspection documentation from a manual chore into a streamlined, accurate process.

---

## Requirements

### Functional Requirements

**Data Import & Processing**
- FR001: System shall import Otter.ai transcript files and parse timestamps, speaker labels, and text content
- FR002: System shall import photos with metadata extraction (timestamp, EXIF data including device, GPS if available)

**Timeline Organization**
- FR003: System shall use timestamps to establish initial chronological ordering of transcript excerpts and photos on the timeline
- FR004: System shall maintain index-based ordering for all timeline items independent of timestamps after initial sort
- FR005: System shall preserve original timestamps as metadata while using index positions for display order
- FR006: System shall provide visual differentiation between transcript items, photo items, and note items on the timeline
- FR007: System shall enable drag-and-drop reordering of timeline items with automatic index reassignment

**AI Context Extraction**
- FR008: System shall use OpenAI API to parse transcript text and extract location attributes (building, floor, unit, room, monitor point) based on natural speech patterns
- FR009: System shall support three site type schemas (Commercial variant 1, Commercial variant 2, Residential) with configurable attribute hierarchies
- FR010: System shall automatically apply extracted location attributes to subsequent timeline items until context explicitly changes
- FR011: System shall identify and flag low-confidence attribute extractions for user review

**Attribute & Item Management**
- FR012: System shall provide CRUD operations for location attributes on any timeline item (manual override of AI extractions)
- FR013: System shall provide CRUD operations for timeline items (edit transcript text, delete items, add captions to photos)

**Note System**
- FR014: System shall support adding notes to timeline items as header notes (displayed before item), footer notes (displayed after item), or free-floating notes (independently positioned)
- FR015: System shall assign index positions to notes without requiring timestamps

**Report Generation**
- FR016: System shall generate formatted inspection reports including all timeline items, attributes, captions, and notes in index order

### Non-Functional Requirements

- NFR001: System shall process inspection data containing up to 3,000 photos and 40 hours of transcript content without performance degradation
- NFR002: AI location attribute extraction shall achieve 90% or greater accuracy without manual intervention
- NFR003: Application shall function correctly on modern browsers (Chrome, Firefox, Safari, Edge - current version and one version back)

---

## UX Design Principles

1. **Timeline-first navigation** - The chronological timeline is the primary interface metaphor, keeping users oriented in the inspection sequence
2. **Visual clarity** - Clear visual differentiation between transcript items, photos, and notes enables quick scanning of large datasets
3. **Contextual awareness** - Location attributes are prominently displayed to maintain spatial context throughout the timeline
4. **Minimal friction editing** - Inline editing, drag-and-drop, and CRUD operations feel natural and don't interrupt workflow

---

## User Interface Design Goals

**Platform & Screens:**
- **Platform:** Web application (desktop browsers primary use case)
- **Core Screens:**
  - Import screen (select transcript file and photo directory, scan metadata without moving files)
  - Timeline view (main workspace with all items, attributes, and editing capabilities)
  - Report preview/generation screen

**Design Constraints:**
- Tailwind CSS for styling
- ShadCN component library for UI components
- Must handle large data volumes (3,000+ photos) with performant rendering (virtualization likely needed)
- Photos referenced in original location (no file upload/storage required)
- Modern browser support only (Chrome, Firefox, Safari, Edge)

---

## Epic List

**Epic 1: Project Foundation & Data Import**
- Establish project infrastructure (Next.js, TypeScript, Tailwind, ShadCN, Supabase)
- Build import functionality for Otter.ai transcripts and photo metadata
- Create basic timeline display with chronological ordering
- Estimated: 6-8 stories

**Epic 2: AI Context Extraction & Timeline Management**
- Implement OpenAI integration for location attribute extraction
- Build attribute management (CRUD, inheritance, schema support)
- Enable timeline item editing, reordering, and CRUD operations
- Implement notes system (header/footer/free-floating)
- Build report generation functionality
- Estimated: 9-11 stories

> **Note:** Detailed epic breakdown with full story specifications is available in [epics.md](./epics.md)

---

## Out of Scope

**Deferred to Future Phases:**
- Audio playback synchronized with transcript timeline (Phase 2 consideration)
- Multi-user support and collaboration features
- Cloud storage and synchronization capabilities
- Mobile application versions (iOS, Android)

**Not Supported in MVP:**
- Video file import and integration
- Custom attribute schemas beyond the 3 predefined site types (Commercial variant 1, Commercial variant 2, Residential)
- Multiple report format exports (focusing on single format for MVP)
- Integration with external inspection or business management tools
- Advanced report templates and customization beyond basic formatting
- Real-time collaboration or concurrent editing
- SharePoint integration (mentioned as post-MVP technical consideration)

**Explicit Exclusions:**
- File upload/storage of photos (photos remain in original file system location, referenced by path)
- User authentication and authorization (single user application)
- Payment processing or subscription management
- Offline mode or progressive web app capabilities
