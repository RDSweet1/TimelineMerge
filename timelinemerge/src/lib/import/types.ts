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
    /** File format detected (.txt or .json) */
    format: OtterTranscriptFormat;
    /** Original file name */
    fileName: string;
  };
}

/**
 * Supported Otter.ai transcript formats
 */
export type OtterTranscriptFormat = 'txt' | 'json';

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
