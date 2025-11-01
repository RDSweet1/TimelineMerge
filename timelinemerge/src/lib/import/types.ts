/**
 * TypeScript types for Otter.ai transcript parsing
 *
 * These types represent the parsed transcript data before it's converted
 * to database entities (TranscriptItem).
 */

/**
 * A single segment from a parsed transcript
 *
 * Timestamps are normalized to HH:MM:SS format for uniform storage
 */
export interface TranscriptSegment {
  /** Timestamp in HH:MM:SS format (e.g., "00:03:45", "01:23:00") */
  timestamp: string;
  /** Speaker label (e.g., "Speaker 1", "David", "Unknown Speaker") */
  speaker: string;
  /** Text content of the segment */
  text: string;
}

/**
 * Complete parsed transcript with metadata
 */
export interface ParsedTranscript {
  /** Array of transcript segments in chronological order */
  segments: TranscriptSegment[];
  /** Optional metadata about the transcript */
  metadata?: {
    /** Total number of segments */
    totalSegments: number;
    /** File format detected (.txt, .json, or .docx) */
    format: TranscriptFormat;
    /** Original file name */
    fileName: string;
  };
}

/**
 * Supported transcript formats
 */
export type TranscriptFormat = 'txt' | 'json' | 'docx';

/**
 * JSON format structure from Otter.ai export
 */
export interface OtterJsonSegment {
  speaker: string;
  start_time: number; // seconds
  end_time?: number; // seconds
  text: string;
}

export interface OtterJsonTranscript {
  segments: OtterJsonSegment[];
}

/**
 * Photo metadata extracted from EXIF data or file metadata
 *
 * Used for photo import workflow before conversion to PhotoItem entity
 */
export interface PhotoMetadata {
  /** Timestamp from EXIF (DateTimeOriginal/CreateDate) or file.lastModified */
  timestamp: Date | null;
  /** Camera device info from EXIF (Make + Model) */
  device: string | null;
  /** GPS coordinates from EXIF */
  gps: { lat: number; lon: number } | null;
  /** Full file path (absolute or relative) */
  filePath: string;
  /** File name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
}

/**
 * Photo file with File handle and relative path
 *
 * Returned by directory picker, used for EXIF extraction
 */
export interface PhotoFile {
  /** Browser File object */
  file: File;
  /** Relative path within selected directory */
  relativePath: string;
}
