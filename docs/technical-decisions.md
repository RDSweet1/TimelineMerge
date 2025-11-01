# Technical Decisions

**Project:** TimelineMerge
**Last Updated:** 2025-10-31

This document captures technical decisions, constraints, and preferences discussed during planning.

---

## File Storage & Import

**Decision:** Photos remain in their original file system location during import. The application imports and stores only metadata (file path, timestamp, EXIF data) in the database, along with user-added data (captions, photo type classifications). The application references photos from their original location rather than uploading/copying them.

**Rationale:**
- Reduces storage requirements
- Faster import process (no file copying)
- Single source of truth for photo files
- Simplifies MVP implementation

**Date Captured:** 2025-10-31

---

## Terminology: Item List vs Timeline

**Decision:** Use "item list" as the primary terminology for the ordered collection of inspection items. While "timeline" may appear in some contexts (especially for the initial timestamp-based sorting), the core concept is an index-based ordered list where users control sequence directly.

**Rationale:**
- Timeline metaphor overemphasizes temporal relationships
- After initial import/sort, timestamps become background metadata
- Users insert items (notes, additional photos) at any index position without timestamps
- "Item list" accurately reflects the index-based ordering mechanism
- Clearer for UI components, database naming, and feature descriptions

**Impact:**
- Primary UI terminology: "Item list", "Inspection items", "Items"
- Database: `items` table with `index` or `sequence` column
- Timeline language acceptable for: initial sorting process, timestamp metadata display

**Date Captured:** 2025-10-31

---
