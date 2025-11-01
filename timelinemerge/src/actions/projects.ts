'use server';

/**
 * Server Actions for Project and Inspection CRUD operations
 *
 * All actions follow the standard pattern:
 * - Return ActionResult<T> (never throw to client)
 * - Validate input before database operations
 * - Use structured logging with [DB] prefix
 * - Handle errors gracefully with user-friendly messages
 */

import { createClient } from '@/lib/supabase/server';
import {
  ActionResult,
  Project,
  Inspection,
  TranscriptItem,
  PhotoItem,
  CreateProjectInput,
  CreateInspectionInput,
  CreateTranscriptItemInput,
  CreatePhotoItemInput,
} from '@/types/database';

// =============================================================================
// Project Operations
// =============================================================================

/**
 * Create a new project
 *
 * @param input - Project creation data
 * @returns ActionResult with created project or error
 */
export async function createProject(
  input: CreateProjectInput
): Promise<ActionResult<Project>> {
  try {
    const supabase = await createClient();

    // Validate input
    if (!input.name || input.name.trim() === '') {
      return { success: false, error: 'Project name is required' };
    }

    // Perform operation
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: input.name.trim(),
        client_name: input.clientName?.trim() || null,
      })
      .select()
      .single();

    // Handle errors
    if (error) {
      console.error('[DB] Failed to create project:', {
        name: input.name,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });
      return { success: false, error: 'Failed to create project' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[DB] Unexpected error creating project:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get a project by ID with optional related data
 *
 * @param id - Project UUID
 * @returns ActionResult with project data or error
 */
export async function getProject(
  id: string
): Promise<ActionResult<Project>> {
  try {
    const supabase = await createClient();

    // Validate input
    if (!id || id.trim() === '') {
      return { success: false, error: 'Project ID is required' };
    }

    // Perform operation
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    // Handle errors
    if (error) {
      console.error('[DB] Failed to get project:', {
        id,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });

      if (error.code === 'PGRST116') {
        return { success: false, error: 'Project not found' };
      }

      return { success: false, error: 'Failed to retrieve project' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[DB] Unexpected error getting project:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get all projects with optional sorting
 *
 * @returns ActionResult with array of projects or error
 */
export async function listProjects(): Promise<ActionResult<Project[]>> {
  try {
    const supabase = await createClient();

    // Perform operation
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    // Handle errors
    if (error) {
      console.error('[DB] Failed to list projects:', {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });
      return { success: false, error: 'Failed to retrieve projects' };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('[DB] Unexpected error listing projects:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Delete a project (cascades to inspections and items)
 *
 * @param id - Project UUID
 * @returns ActionResult with success status or error
 */
export async function deleteProject(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();

    // Validate input
    if (!id || id.trim() === '') {
      return { success: false, error: 'Project ID is required' };
    }

    // Perform operation
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    // Handle errors
    if (error) {
      console.error('[DB] Failed to delete project:', {
        id,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });
      return { success: false, error: 'Failed to delete project' };
    }

    return { success: true, data: { id } };
  } catch (error) {
    console.error('[DB] Unexpected error deleting project:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =============================================================================
// Inspection Operations
// =============================================================================

/**
 * Create a new inspection within a project
 *
 * @param input - Inspection creation data
 * @returns ActionResult with created inspection or error
 */
export async function createInspection(
  input: CreateInspectionInput
): Promise<ActionResult<Inspection>> {
  try {
    const supabase = await createClient();

    // Validate input
    if (!input.projectId || input.projectId.trim() === '') {
      return { success: false, error: 'Project ID is required' };
    }
    if (!input.name || input.name.trim() === '') {
      return { success: false, error: 'Inspection name is required' };
    }

    // Perform operation
    const { data, error } = await supabase
      .from('inspections')
      .insert({
        project_id: input.projectId,
        name: input.name.trim(),
        inspection_date: input.inspectionDate || null,
        site_type_schema: input.siteTypeSchema || null,
      })
      .select()
      .single();

    // Handle errors
    if (error) {
      console.error('[DB] Failed to create inspection:', {
        projectId: input.projectId,
        name: input.name,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });

      // Check for foreign key violation (project doesn't exist)
      if (error.code === '23503') {
        return { success: false, error: 'Project not found' };
      }

      return { success: false, error: 'Failed to create inspection' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[DB] Unexpected error creating inspection:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get an inspection by ID
 *
 * @param id - Inspection UUID
 * @returns ActionResult with inspection data or error
 */
export async function getInspection(
  id: string
): Promise<ActionResult<Inspection>> {
  try {
    const supabase = await createClient();

    // Validate input
    if (!id || id.trim() === '') {
      return { success: false, error: 'Inspection ID is required' };
    }

    // Perform operation
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', id)
      .single();

    // Handle errors
    if (error) {
      console.error('[DB] Failed to get inspection:', {
        id,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });

      if (error.code === 'PGRST116') {
        return { success: false, error: 'Inspection not found' };
      }

      return { success: false, error: 'Failed to retrieve inspection' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[DB] Unexpected error getting inspection:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get all inspections for a project
 *
 * @param projectId - Project UUID
 * @returns ActionResult with array of inspections or error
 */
export async function listInspectionsByProject(
  projectId: string
): Promise<ActionResult<Inspection[]>> {
  try {
    const supabase = await createClient();

    // Validate input
    if (!projectId || projectId.trim() === '') {
      return { success: false, error: 'Project ID is required' };
    }

    // Perform operation
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Handle errors
    if (error) {
      console.error('[DB] Failed to list inspections:', {
        projectId,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });
      return { success: false, error: 'Failed to retrieve inspections' };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('[DB] Unexpected error listing inspections:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =============================================================================
// Timeline Item Operations
// =============================================================================

/**
 * Create a new transcript item
 *
 * @param input - Transcript item creation data
 * @returns ActionResult with created transcript item or error
 */
export async function createTranscriptItem(
  input: CreateTranscriptItemInput
): Promise<ActionResult<TranscriptItem>> {
  try {
    const supabase = await createClient();

    // Validate input
    if (!input.inspectionId || input.inspectionId.trim() === '') {
      return { success: false, error: 'Inspection ID is required' };
    }
    if (input.indexPosition === undefined || input.indexPosition < 0) {
      return { success: false, error: 'Valid index position is required' };
    }
    if (!input.textContent || input.textContent.trim() === '') {
      return { success: false, error: 'Text content is required' };
    }

    // Perform operation
    const { data, error } = await supabase
      .from('transcript_items')
      .insert({
        inspection_id: input.inspectionId,
        index_position: input.indexPosition,
        timestamp: input.timestamp || null,
        speaker_label: input.speakerLabel?.trim() || null,
        text_content: input.textContent.trim(),
      })
      .select()
      .single();

    // Handle errors
    if (error) {
      console.error('[DB] Failed to create transcript item:', {
        inspectionId: input.inspectionId,
        indexPosition: input.indexPosition,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });

      // Check for unique constraint violation (duplicate index_position)
      if (error.code === '23505') {
        return {
          success: false,
          error: 'An item already exists at this position',
        };
      }

      // Check for foreign key violation (inspection doesn't exist)
      if (error.code === '23503') {
        return { success: false, error: 'Inspection not found' };
      }

      return { success: false, error: 'Failed to create transcript item' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[DB] Unexpected error creating transcript item:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Create a new photo item
 *
 * @param input - Photo item creation data
 * @returns ActionResult with created photo item or error
 */
export async function createPhotoItem(
  input: CreatePhotoItemInput
): Promise<ActionResult<PhotoItem>> {
  try {
    const supabase = await createClient();

    // Validate input
    if (!input.inspectionId || input.inspectionId.trim() === '') {
      return { success: false, error: 'Inspection ID is required' };
    }
    if (input.indexPosition === undefined || input.indexPosition < 0) {
      return { success: false, error: 'Valid index position is required' };
    }
    if (!input.filePath || input.filePath.trim() === '') {
      return { success: false, error: 'File path is required' };
    }

    // Perform operation
    const { data, error } = await supabase
      .from('photo_items')
      .insert({
        inspection_id: input.inspectionId,
        index_position: input.indexPosition,
        timestamp: input.timestamp || null,
        file_path: input.filePath.trim(),
        caption: input.caption?.trim() || null,
        exif_data: input.exifData || null,
      })
      .select()
      .single();

    // Handle errors
    if (error) {
      console.error('[DB] Failed to create photo item:', {
        inspectionId: input.inspectionId,
        indexPosition: input.indexPosition,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });

      // Check for unique constraint violation (duplicate index_position)
      if (error.code === '23505') {
        return {
          success: false,
          error: 'An item already exists at this position',
        };
      }

      // Check for foreign key violation (inspection doesn't exist)
      if (error.code === '23503') {
        return { success: false, error: 'Inspection not found' };
      }

      return { success: false, error: 'Failed to create photo item' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[DB] Unexpected error creating photo item:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: 'An unexpected error occurred' };
  }
}
