# Product Brief: TimelineMerge

**Date:** 2025-10-31
**Author:** David
**Status:** Draft for PM Review

---

## Executive Summary

TimelineMerge is a web-based inspection documentation tool that eliminates the manual process of merging Otter.ai transcripts and photos into Word/PDF reports. Built for property damage inspectors, the application organizes transcript excerpts and photos on a synchronized timeline, uses AI to automatically extract and apply location attributes (building, floor, unit, room, monitor point), and generates professional inspection reports.

**The Problem:** Inspectors currently spend significant time manually copying transcripts and photos into Word/PDF documents, a tedious and error-prone process that fails to preserve the chronological relationship between spoken observations and visual evidence.

**The Solution:** An intelligent timeline interface that imports Otter.ai transcripts and photos, uses OpenAI to parse location context from natural speech patterns, and enables drag-and-drop organization with inline editing and annotation capabilities.

**Target Users:** Property damage inspectors conducting onsite inspections of water/fire damaged properties. Single user application with no authorization requirements for MVP.

**Core Value:** Automated attribute extraction, preserved timeline relationships, single source of truth for inspection documentation, and streamlined report generation.

---

## Problem Statement

Current process involves manually merging Otter.ai transcripts and photos into Word/PDF documents. This manual process is tedious, error-prone, and doesn't preserve the timeline relationship between spoken context and visual evidence captured during property damage inspections.

---

## Proposed Solution

TimelineMerge is a timeline-based application that automatically organizes Otter.ai transcripts and inspection photos into a synchronized, editable timeline. The solution uses AI to extract location context (building, floor, unit, room, monitor point) from spoken patterns in transcripts and applies these attributes to subsequent timeline items until context changes.

**Key differentiators:**
- Preserves chronological relationship between spoken observations and visual evidence
- Automates attribute extraction and inheritance from natural speech patterns
- Supports three site type schemas (2 commercial variants + residential) with flexible attribute hierarchies
- Enables inline editing, reordering, and annotation of timeline items
- Generates inspection reports directly from the organized timeline

**Why this will succeed:**
- Eliminates manual copy-paste workflow
- Maintains contextual accuracy through AI-powered attribute tracking
- Provides single source of truth for inspection documentation

---

## Target Users

### Primary User Segment

**Property Damage Inspector** - Single user (initially) who conducts onsite inspections of damaged properties. Captures observations via Otter.ai while photographing damage. Moderate technical skill level - comfortable with software tools but not a power user.

**Key characteristics:**
- Performs field inspections of water/fire damaged properties
- Uses Otter.ai for audio recording and standard device camera for photos
- Needs to create organized, professional inspection reports post-visit
- Works independently - no authorization/user management needed for MVP

### Secondary User Segment

None - single user application with no role differentiation.

---

## Goals and Success Metrics

### Business Objectives

- Replace manual Word/PDF merging workflow entirely
- Tool is stable and reliable for regular use

### User Success Metrics

- Inspector can import Otter.ai transcript + photos and generate organized timeline
- AI correctly extracts and applies location attributes with minimal manual correction
- Inspector can produce professional inspection report from timeline data

### Key Performance Indicators (KPIs)

- Tool successfully processes 100% of inspection data (transcripts + photos)
- AI attribute extraction accuracy (target: 90%+ correct without manual intervention)
- Report generation produces usable output without extensive post-editing

---

## MVP Scope

### Core Features (Must Have)

1. **Data Import**
   - Import Otter.ai transcript files with timestamps
   - Import photos with metadata (timestamp, EXIF data)

2. **Timeline View**
   - Display transcript excerpts and photos in chronological order
   - Visual timeline showing both text items and images with timestamps

3. **AI Context Extraction**
   - Parse transcript for location patterns (building, floor, unit, room, monitor point)
   - Automatically apply extracted attributes to subsequent timeline items
   - Support three site type schemas (Commercial variant 1, Commercial variant 2, Residential)

4. **Attribute Management**
   - CRUD operations on attributes for any timeline item
   - Context inheritance (attributes persist until explicitly changed)

5. **Timeline Item Management**
   - CRUD operations on all timeline items (transcript excerpts, photos)
   - Drag-and-drop reordering of items
   - Photo captioning

6. **Note System**
   - Add notes to timeline items (header, footer, or free-floating)
   - Header/footer notes move with their items
   - Free-floating notes stay positioned independently

7. **Report Generation**
   - Generate formatted inspection report from timeline data
   - Include all items with their attributes, captions, and notes

### Nice to Have (Not Required for MVP)

- **Audio Playback & Sync**
  - Access audio files (MP3) stored externally
  - Play audio synchronized with transcript timeline
  - Navigate to specific timeline points to verify transcription accuracy
  - Audio playback controls integrated with timeline view

### Out of Scope for MVP

- Multi-user support and collaboration features
- Cloud storage and synchronization
- Mobile application version
- Advanced report templates and customization beyond basic formatting
- Integration with other inspection or business management tools
- Video support
- Custom attribute schemas beyond the 3 predefined site types
- Export to multiple formats (focus on single report format for MVP)
- Any other business-specific features not directly related to timeline/transcript merging

### MVP Success Criteria

- Successfully import and process a complete inspection (transcript + photos)
- Timeline displays all items in correct chronological order
- AI extracts location attributes with 90%+ accuracy
- User can correct any mis-extracted attributes
- User can reorder items, add captions and notes
- Generate a complete inspection report ready for client delivery

---

## Post-MVP Vision

### Phase 2 Features

- **Audio Playback & Sync** - Access external audio files and sync playback with transcript timeline for transcription verification

### Future Considerations

Additional features and enhancements will be identified based on MVP usage and evolving business needs.

---

## Technical Considerations

### Platform Requirements

- **Application Type:** Web application (React/Next.js)
- **Deployment:**
  - Development: Local with Supabase database
  - Production: Vercel (serverless architecture)
- **Data Storage:**
  - MVP: Local file storage
  - Future: SharePoint integration (post-MVP consideration)
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge)

### Technology Preferences

- **Frontend Framework:** React with Next.js
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Component Library:** ShadCN
- **Database:** Supabase (PostgreSQL)
- **AI/LLM:** OpenAI API for context extraction and attribute parsing
- **Hosting:** Vercel

### Architecture Considerations

- **Serverless Constraints:** All backend operations must be compatible with Vercel serverless functions
- **Free Tier Optimization:** Target Supabase and Vercel free tiers for as long as possible; design with usage limits in mind
- **File Handling:** Photo and transcript files stored locally during MVP; file upload/storage strategy needed
- **AI Integration:** OpenAI API calls for parsing transcripts and extracting location attributes
- **Database Design:** Supabase PostgreSQL for timeline items, attributes, notes, and metadata
- **State Management:** TBD based on complexity (React Context, Zustand, or similar)

---

## Constraints and Assumptions

### Key Assumptions

- Otter.ai transcript format remains consistent and parseable
- Photos contain reliable timestamp metadata (EXIF data) for chronological ordering
- Network connectivity available for AI API calls during timeline creation and attribute extraction
- Inspector uses consistent verbal patterns when identifying locations (building, floor, unit, room)
- Typical inspection volume: 3-40 hours of transcript content and 100-3000 photos per inspection
- Single user access pattern - no concurrent multi-user scenarios to handle

---

---

_This Product Brief serves as the foundational input for Product Requirements Document (PRD) creation._

_Next Steps: Handoff to Product Manager for PRD development._
