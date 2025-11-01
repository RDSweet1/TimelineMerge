-- Migration: Add elapsed_time field to transcript_items
-- Story: 1.3.3 Elapsed Time / Absolute Timestamp Handling
-- Description: Preserves original elapsed time from transcripts (e.g., "00:03:45")
-- File: 20251101120000_add_elapsed_time_field.sql

-- Add elapsed_time field (nullable for backward compatibility)
ALTER TABLE transcript_items
  ADD COLUMN elapsed_time TEXT;

-- Add CHECK constraint for format validation
ALTER TABLE transcript_items
  ADD CONSTRAINT check_elapsed_time_format
    CHECK (elapsed_time IS NULL OR elapsed_time ~ '^\d{2}:\d{2}:\d{2}$');

-- Add comment documenting field purpose
COMMENT ON COLUMN transcript_items.elapsed_time IS
  'Elapsed time from recording start (e.g., ''00:03:45''). Represents relative time offset, not absolute timestamp.';

-- Note: No index on elapsed_time - not used for querying or ordering
-- Ordering handled by index_position field

-- Update timeline_items view to include elapsed_time
CREATE OR REPLACE VIEW timeline_items AS
  -- Transcript items
  SELECT
    id,
    inspection_id,
    index_position,
    timestamp,
    elapsed_time,
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
    NULL as elapsed_time,
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
    NULL as elapsed_time,
    'note' AS item_type,
    text_content AS content,
    NULL AS speaker_label,
    NULL AS file_path,
    NULL AS caption,
    created_at,
    updated_at
  FROM note_items

  ORDER BY index_position;
