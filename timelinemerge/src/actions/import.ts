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
import { parseOtterTranscript } from '@/lib/import/transcript-parser';

/**
 * Import Otter.ai transcript file
 *
 * Parses the transcript content, extracts segments, and stores them as transcript items.
 * File reading happens on the client side using file.text(), content is passed as string.
 *
 * @param inspectionId - UUID of inspection to import into
 * @param fileContent - File content as string (read on client)
 * @param fileName - File name (used to detect format: .txt or .json)
 * @returns ActionResult with count of imported items or error
 */
export async function importTranscript(
  inspectionId: string,
  fileContent: string,
  fileName: string
): Promise<ActionResult<{ count: number }>> {
  try {
    // Validate input
    if (!inspectionId || inspectionId.trim() === '') {
      return { success: false, error: 'Inspection ID is required' };
    }
    if (!fileContent || fileContent.trim().length === 0) {
      return { success: false, error: 'File content is empty' };
    }
    if (!fileName || fileName.trim() === '') {
      return { success: false, error: 'File name is required' };
    }

    console.log('[Import] Starting transcript import:', {
      inspectionId,
      fileName,
      contentLength: fileContent.length,
      timestamp: new Date().toISOString(),
    });

    // Parse transcript (fileContent is string, fileName for format detection)
    let parsed;
    try {
      parsed = parseOtterTranscript(fileContent, fileName);
    } catch (parseError) {
      console.error('[Import] Failed to parse transcript:', {
        inspectionId,
        fileName,
        error:
          parseError instanceof Error
            ? parseError.message
            : 'Unknown parse error',
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        error:
          parseError instanceof Error
            ? parseError.message
            : 'Failed to parse transcript file',
      };
    }

    if (!parsed.segments || parsed.segments.length === 0) {
      return {
        success: false,
        error: 'No transcript segments found in file',
      };
    }

    console.log('[Import] Parsed transcript segments:', {
      inspectionId,
      fileName,
      segmentCount: parsed.segments.length,
      format: parsed.metadata?.format,
      timestamp: new Date().toISOString(),
    });

    // Sort segments by timestamp (chronological order)
    const sortedSegments = parsed.segments.sort((a, b) =>
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

    console.log('[Import] Successfully imported transcript:', {
      inspectionId,
      fileName,
      count: data.length,
      timestamp: new Date().toISOString(),
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
