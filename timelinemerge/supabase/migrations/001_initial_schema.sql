-- TimelineMerge Database Schema - Initial Migration
-- Generated: 2025-11-01
-- Story: 1.2 Database Foundation
-- Description: Complete database schema with hierarchical project/inspection/item structure

-- =============================================================================
-- Table: projects
-- Description: Top-level entity representing a project containing inspections
-- =============================================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- =============================================================================
-- Table: inspections
-- Description: Inspection events within a project
-- =============================================================================
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  inspection_date DATE,
  site_type_schema TEXT CHECK (site_type_schema IN ('commercial_v1', 'commercial_v2', 'residential')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_inspections_project_id ON inspections(project_id);
CREATE INDEX idx_inspections_created_at ON inspections(created_at DESC);

-- =============================================================================
-- Table: transcript_items
-- Description: Transcript entries with timestamps and speaker labels
-- =============================================================================
CREATE TABLE transcript_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  index_position INTEGER NOT NULL,
  timestamp TIMESTAMPTZ,
  speaker_label TEXT,
  text_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique ordering within an inspection
  CONSTRAINT uq_transcript_items_inspection_position UNIQUE (inspection_id, index_position)
);

-- Indexes for efficient querying and ordering
CREATE INDEX idx_transcript_items_inspection_id ON transcript_items(inspection_id);
CREATE INDEX idx_transcript_items_inspection_position ON transcript_items(inspection_id, index_position);

-- =============================================================================
-- Table: photo_items
-- Description: Photo entries with file paths and EXIF metadata
-- =============================================================================
CREATE TABLE photo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  index_position INTEGER NOT NULL,
  timestamp TIMESTAMPTZ,
  file_path TEXT NOT NULL,
  caption TEXT,
  exif_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique ordering within an inspection
  CONSTRAINT uq_photo_items_inspection_position UNIQUE (inspection_id, index_position)
);

-- Indexes for efficient querying and ordering
CREATE INDEX idx_photo_items_inspection_id ON photo_items(inspection_id);
CREATE INDEX idx_photo_items_inspection_position ON photo_items(inspection_id, index_position);

-- =============================================================================
-- Table: note_items
-- Description: User notes (headers, footers, free-floating) with associations
-- =============================================================================
CREATE TABLE note_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  index_position INTEGER NOT NULL,
  note_type TEXT NOT NULL CHECK (note_type IN ('header', 'footer', 'free_floating')),
  associated_item_id UUID,
  associated_item_type TEXT CHECK (associated_item_type IN ('transcript', 'photo') OR associated_item_type IS NULL),
  text_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique ordering within an inspection
  CONSTRAINT uq_note_items_inspection_position UNIQUE (inspection_id, index_position)
);

-- Indexes for efficient querying and ordering
CREATE INDEX idx_note_items_inspection_id ON note_items(inspection_id);
CREATE INDEX idx_note_items_inspection_position ON note_items(inspection_id, index_position);
CREATE INDEX idx_note_items_associated_item ON note_items(associated_item_id, associated_item_type);

-- =============================================================================
-- Table: location_attributes
-- Description: Polymorphic location data for any item type
-- =============================================================================
CREATE TABLE location_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('transcript', 'photo', 'note')),
  building TEXT,
  floor TEXT,
  unit TEXT,
  room TEXT,
  monitor_point TEXT,
  extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
  is_inherited BOOLEAN NOT NULL DEFAULT false,
  manually_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one location record per item
  CONSTRAINT uq_location_attributes_item UNIQUE (item_id, item_type)
);

-- Index for efficient polymorphic lookups
CREATE INDEX idx_location_attributes_item ON location_attributes(item_id, item_type);

-- =============================================================================
-- View: timeline_items
-- Description: Unified view of all item types ordered by index_position
-- =============================================================================
CREATE OR REPLACE VIEW timeline_items AS
  -- Transcript items
  SELECT
    id,
    inspection_id,
    index_position,
    timestamp,
    'transcript' AS item_type,
    text_content AS content,
    speaker_label,
    NULL AS file_path,
    NULL AS caption,
    created_at,
    updated_at
  FROM transcript_items

  UNION ALL

  -- Photo items
  SELECT
    id,
    inspection_id,
    index_position,
    timestamp,
    'photo' AS item_type,
    caption AS content,
    NULL AS speaker_label,
    file_path,
    caption,
    created_at,
    updated_at
  FROM photo_items

  UNION ALL

  -- Note items
  SELECT
    id,
    inspection_id,
    index_position,
    NULL AS timestamp,
    'note' AS item_type,
    text_content AS content,
    NULL AS speaker_label,
    NULL AS file_path,
    NULL AS caption,
    created_at,
    updated_at
  FROM note_items

  ORDER BY index_position;

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- Tables created: 6 (projects, inspections, transcript_items, photo_items, note_items, location_attributes)
-- Views created: 1 (timeline_items)
-- Indexes created: 11 (for performance optimization)
-- Constraints: UNIQUE on (inspection_id, index_position) for all item tables
-- Relationships: ON DELETE CASCADE for all foreign keys
