/**
 * Database Type Definitions for TimelineMerge
 *
 * These types mirror the database schema and should be kept in sync with
 * the SQL schema defined in supabase/migrations/001_initial_schema.sql
 */

// =============================================================================
// Core Entity Types
// =============================================================================

/**
 * Project entity - Top-level container for inspections
 */
export interface Project {
  id: string;
  name: string;
  client_name: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Inspection entity - Inspection event within a project
 */
export interface Inspection {
  id: string;
  project_id: string;
  name: string;
  inspection_date: string | null;
  site_type_schema: 'commercial_v1' | 'commercial_v2' | 'residential' | null;
  created_at: string;
  updated_at: string;
}

/**
 * Transcript item - Transcript entry with speaker and timestamp
 */
export interface TranscriptItem {
  id: string;
  inspection_id: string;
  index_position: number;
  timestamp: string | null;
  elapsed_time: string | null;
  speaker_label: string | null;
  text_content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Photo item - Photo entry with file path and EXIF data
 */
export interface PhotoItem {
  id: string;
  inspection_id: string;
  index_position: number;
  timestamp: string | null;
  file_path: string;
  caption: string | null;
  exif_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Note item - User note (header, footer, or free-floating)
 */
export interface NoteItem {
  id: string;
  inspection_id: string;
  index_position: number;
  note_type: 'header' | 'footer' | 'free_floating';
  associated_item_id: string | null;
  associated_item_type: 'transcript' | 'photo' | null;
  text_content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Location attributes - Polymorphic location data for any item type
 */
export interface LocationAttributes {
  id: string;
  item_id: string;
  item_type: 'transcript' | 'photo' | 'note';
  building: string | null;
  floor: string | null;
  unit: string | null;
  room: string | null;
  monitor_point: string | null;
  extraction_confidence: number | null;
  is_inherited: boolean;
  manually_edited: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Timeline item - Unified view result from timeline_items view
 * Combines all item types into a single interface for timeline display
 */
export interface TimelineItem {
  id: string;
  inspection_id: string;
  index_position: number;
  timestamp: string | null;
  elapsed_time: string | null;
  item_type: 'transcript' | 'photo' | 'note';
  content: string | null;
  speaker_label: string | null;
  file_path: string | null;
  caption: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Server Action Result Types
// =============================================================================

/**
 * Standard result type for all Server Actions
 * Never throw errors to client - always return ActionResult
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// =============================================================================
// Input Types for Server Actions
// =============================================================================

/**
 * Input data for creating a new project
 */
export interface CreateProjectInput {
  name: string;
  clientName?: string;
}

/**
 * Input data for creating a new inspection
 */
export interface CreateInspectionInput {
  projectId: string;
  name: string;
  inspectionDate?: string;
  siteTypeSchema?: 'commercial_v1' | 'commercial_v2' | 'residential';
}

/**
 * Input data for creating a transcript item
 */
export interface CreateTranscriptItemInput {
  inspectionId: string;
  indexPosition: number;
  timestamp?: string;
  speakerLabel?: string;
  textContent: string;
}

/**
 * Input data for creating a photo item
 */
export interface CreatePhotoItemInput {
  inspectionId: string;
  indexPosition: number;
  timestamp?: string;
  filePath: string;
  caption?: string;
  exifData?: Record<string, unknown>;
}

/**
 * Input data for creating a note item
 */
export interface CreateNoteItemInput {
  inspectionId: string;
  indexPosition: number;
  noteType: 'header' | 'footer' | 'free_floating';
  associatedItemId?: string;
  associatedItemType?: 'transcript' | 'photo';
  textContent: string;
}

/**
 * Input data for creating location attributes
 */
export interface CreateLocationAttributesInput {
  itemId: string;
  itemType: 'transcript' | 'photo' | 'note';
  building?: string;
  floor?: string;
  unit?: string;
  room?: string;
  monitorPoint?: string;
  extractionConfidence?: number;
  isInherited?: boolean;
  manuallyEdited?: boolean;
}
