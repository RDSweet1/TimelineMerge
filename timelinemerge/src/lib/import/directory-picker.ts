/**
 * File System Access API directory picker helper
 *
 * Provides browser-based directory selection using the File System Access API.
 * Filters for supported image file types (JPG, JPEG, PNG).
 */

import { PhotoFile } from './types';

/**
 * Select a directory of photos using File System Access API
 *
 * Opens native OS directory picker and returns array of supported photo files.
 * Supported formats: JPG, JPEG, PNG (case-insensitive)
 *
 * @returns Array of PhotoFile objects with File handle and relative path
 * @throws Error if File System Access API not supported or permission denied
 */
export async function selectPhotoDirectory(): Promise<PhotoFile[]> {
  // Check if File System Access API is supported
  if (!('showDirectoryPicker' in window)) {
    throw new Error(
      'File System Access API not supported. Please use Chrome, Edge, or Opera browser.'
    );
  }

  try {
    // Request directory picker with read permission
    const dirHandle = await window.showDirectoryPicker({
      mode: 'read',
    });

    const photoFiles: PhotoFile[] = [];

    // Supported image MIME types
    const supportedTypes = ['image/jpeg', 'image/png'];

    // Iterate through directory entries
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();

        // Filter for supported image types
        if (!supportedTypes.includes(file.type)) {
          continue;
        }

        photoFiles.push({
          file,
          relativePath: file.webkitRelativePath || file.name,
        });
      }
    }

    return photoFiles;
  } catch (error) {
    // User cancelled directory picker
    if (error instanceof Error && error.name === 'AbortError') {
      return [];
    }

    // Re-throw other errors (permission denied, etc.)
    throw error;
  }
}
