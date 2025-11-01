'use server';

/**
 * Server Actions for Transcript Import
 *
 * Handles importing Otter.ai transcript files and storing them as transcript items.
 * All actions follow the standard pattern:
 * - Return ActionResult<T> (never throw to client)
 * - Validate input before operations
 * - Use structured logging with [Import] prefix
 * - Handle errors gracefully with user-friendly messages
 */

import { createClient } from '@/lib/supabase/server';
import { ActionResult } from '@/types/database';
import { ParsedTranscript } from '@/lib/import/types';

/**
 * Import Otter.ai transcript file
 *
 * Parses the transcript content, extracts segments, and stores them as transcript items.
  * Receives pre-parsed transcript content and stores as transcript items.
  * File reading and parsing happen on the client side using readAndParseTranscriptFile().
 * @param inspectionId - UUID of inspection to import into
  * @param parsedTranscript - Parsed transcript with segments (parsed on client)
  * @param fileName - File name (for logging and metadata)
 * @returns ActionResult with count of imported items or error
 */
export async function importTranscript(
  inspectionId: string,
  parsedTranscript: ParsedTranscript,
  fileName: string
): Promise<ActionResult<{ count: number }>> {
  try {
    // Validate input
    if (!inspectionId || inspectionId.trim() === '') {
      return { success: false, error: 'Inspection ID is required' };
    }
    if (!parsedTranscript || !parsedTranscript.segments || parsedTranscript.segments.length === 0) {
      return { success: false, error: 'Parsed transcript is empty or invalid' };
    }
    if (!fileName || fileName.trim() === '') {
      return { success: false, error: 'File name is required' };
    }

    console.log('[Import] Starting transcript import:', {
      inspectionId,
      fileName,
      segmentCount: parsedTranscript.segments.length,
      format: parsedTranscript.metadata?.format,
      timestamp: new Date().toISOString(),
    });
    // Sort segments by timestamp (chronological order)
    const sortedSegments = parsedTranscript.segments.sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );

    // Prepare items for batch insert
    const supabase = await createClient();
    const itemsToInsert = sortedSegments.map((segment, index) => ({
      inspection_id: inspectionId,
      index_position: index,
      // Note: timestamp field is TIMESTAMPTZ in DB, but we only have elapsed time (HH:MM:SS)
      // For MVP, store NULL and rely on index_position for ordering
      // Future enhancement: add elapsed_time TEXT field to store HH:MM:SS format
      timestamp: null,
      elapsed_time: segment.elapsed_time || null,
      speaker_label: segment.speaker,
      text_content: segment.text,
    }));

    // Batch insert all transcript items
    const { data, error } = await supabase
      .from('transcript_items')
      .insert(itemsToInsert)
      .select();

    if (error) {
      console.error('[Import] Failed to insert transcript items:', {
        inspectionId,
        fileName,
        count: itemsToInsert.length,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });

      // Handle UNIQUE constraint violation (duplicate import)
      if (error.code === '23505') {
        return {
          success: false,
          error:
            'This inspection already has transcript items. Delete existing items before re-importing.',
        };
      }

      // Handle foreign key violation (inspection doesn't exist)
      if (error.code === '23503') {
        return {
          success: false,
          error: 'Inspection not found',
        };
      }

      return {
        success: false,
        error: 'Failed to import transcript',
      };
    }

    // Get elapsed_time range for logging
    const firstElapsed = sortedSegments[0]?.elapsed_time;
    const lastElapsed = sortedSegments[sortedSegments.length - 1]?.elapsed_time;

    console.log('[Import] Successfully imported transcript:', {
      inspectionId,
      fileName,
      count: data.length,
      timestamp: new Date().toISOString(),
      ...(firstElapsed && lastElapsed ? { elapsedTimeRange: `${firstElapsed} to ${lastElapsed}` } : {}),
    });

    return { success: true, data: { count: data.length } };
  } catch (error) {
    console.error('[Import] Unexpected error:', {
      inspectionId,
      fileName,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return {
      success: false,
      error: 'An unexpected error occurred during import',
    };
  }
}

/**
 * Import photos from directory
 *
 * Receives photo metadata extracted on client side and stores as photo items.
 * Photos are sorted chronologically by timestamp and assigned sequential index positions.
 *
 * @param inspectionId - UUID of inspection to import into
 * @param photos - Array of PhotoMetadata objects with EXIF data
 * @returns ActionResult with count of imported photos or error
 */
export async function importPhotos(
  inspectionId: string,
  photos: Array<{
    timestamp: Date | null;
    device: string | null;
    gps: { lat: number; lon: number } | null;
    filePath: string;
    fileName: string;
    fileSize: number;
  }>
): Promise<ActionResult<{ count: number }>> {
  try {
    // Validate input
    if (!inspectionId || inspectionId.trim() === '') {
      return { success: false, error: 'Inspection ID is required' };
    }
    if (!photos || photos.length === 0) {
      return { success: false, error: 'No photos provided' };
    }

    console.log('[Import] Starting photo import:', {
      inspectionId,
      photoCount: photos.length,
      timestamp: new Date().toISOString(),
    });

    // Sort by timestamp (chronological order, nulls last)
    const sortedPhotos = [...photos].sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    // Batch insert items
    const supabase = await createClient();
    const itemsToInsert = sortedPhotos.map((photo, index) => ({
      inspection_id: inspectionId,
      index_position: index,
      timestamp: photo.timestamp ? photo.timestamp.toISOString() : null,
      file_path: photo.filePath,
      caption: null,
      exif_data: {
        device: photo.device,
        gps: photo.gps,
        fileName: photo.fileName,
        fileSize: photo.fileSize,
      },
    }));

    const { data, error } = await supabase
      .from('photo_items')
      .insert(itemsToInsert)
      .select();

    if (error) {
      console.error('[Import] Failed to insert photo items:', {
        inspectionId,
        count: itemsToInsert.length,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });

      // Handle UNIQUE constraint violation (duplicate import)
      if (error.code === '23505') {
        return {
          success: false,
          error:
            'This inspection already has photo items. Delete existing items before re-importing.',
        };
      }

      // Handle foreign key violation (inspection doesn't exist)
      if (error.code === '23503') {
        return {
          success: false,
          error: 'Inspection not found',
        };
      }

      return { success: false, error: 'Failed to import photos' };
    }

    console.log('[Import] Successfully imported photos:', {
      inspectionId,
      count: data.length,
      timestamp: new Date().toISOString(),
    });

    return { success: true, data: { count: data.length } };
  } catch (error) {
    console.error('[Import] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: 'An unexpected error occurred' };
  }
}
