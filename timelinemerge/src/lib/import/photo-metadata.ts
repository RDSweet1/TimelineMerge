/**
 * Photo metadata extraction module
 *
 * Extracts EXIF metadata from photo files using the exifr library.
 * Handles missing EXIF data gracefully with fallback to file metadata.
 */

import exifr from 'exifr';
import { PhotoMetadata } from './types';

/**
 * Extract photo metadata from a file
 *
 * Extracts EXIF data (timestamp, device, GPS) from photo files.
 * Falls back to file.lastModified if EXIF timestamp is missing.
 *
 * @param file - Browser File object for photo
 * @returns PhotoMetadata with extracted data
 */
export async function extractPhotoMetadata(
  file: File
): Promise<PhotoMetadata> {
  try {
    // Extract specific EXIF tags for performance
    const exif = await exifr.parse(file, {
      pick: [
        'DateTimeOriginal',
        'CreateDate',
        'Make',
        'Model',
        'GPSLatitude',
        'GPSLongitude',
      ],
    });

    // Extract timestamp (prefer DateTimeOriginal, fallback to CreateDate, then file.lastModified)
    let timestamp: Date | null = null;
    if (exif?.DateTimeOriginal) {
      timestamp = new Date(exif.DateTimeOriginal);
    } else if (exif?.CreateDate) {
      timestamp = new Date(exif.CreateDate);
    } else {
      timestamp = new Date(file.lastModified);
    }

    // Extract device info (combine Make + Model)
    const device =
      [exif?.Make, exif?.Model].filter(Boolean).join(' ') || null;

    // Extract GPS coordinates
    const gps =
      exif?.GPSLatitude && exif?.GPSLongitude
        ? { lat: exif.GPSLatitude, lon: exif.GPSLongitude }
        : null;

    return {
      timestamp,
      device,
      gps,
      filePath: file.webkitRelativePath || file.name,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (error) {
    // EXIF parsing failed - use file metadata fallback
    console.warn('[Import] Failed to extract EXIF data:', {
      fileName: file.name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      timestamp: new Date(file.lastModified),
      device: null,
      gps: null,
      filePath: file.webkitRelativePath || file.name,
      fileName: file.name,
      fileSize: file.size,
    };
  }
}
