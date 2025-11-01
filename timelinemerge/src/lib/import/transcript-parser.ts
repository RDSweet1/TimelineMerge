/**
 * Otter.ai Transcript Parser
 *
 * Parses transcript files in .txt, .json, .docx, and .pdf formats.
 * Extracts timestamps, speaker labels, and text content.
 * Normalizes all timestamps to HH:MM:SS format for uniform storage.
 */

import mammoth from 'mammoth';
import {
  TranscriptSegment,
  ParsedTranscript,
  TranscriptFormat,
  OtterJsonTranscript,
  OtterJsonSegment,
} from './types';

/**
 * Read and parse transcript file (client-side wrapper)
 *
 * This wrapper function handles all file format detection and reading client-side.
 * It extracts plain text from .docx files using mammoth.js and .pdf files using
 * pdfjs-dist, then calls the existing parseOtterTranscript() function to parse the content.
 *
 * @param file - File object from file input
 * @returns ParsedTranscript with segments and metadata
 * @throws Error if file format is unsupported or parsing fails
 */
export async function readAndParseTranscriptFile(
  file: File
): Promise<ParsedTranscript> {
  try {
    let fileContent: string;

    // Check file extension
    const fileExtension = file.name
      .substring(file.name.lastIndexOf('.'))
      .toLowerCase();

    if (fileExtension === '.pdf') {
      // Extract text from PDF document using pdfjs-dist
      // Dynamic import to avoid SSR issues
      try {
        const pdfjsLib = await import('pdfjs-dist');

        // Configure worker path (only in browser environment)
        if (typeof window !== 'undefined') {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';
        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => {
              // PDF text items have a 'str' property containing the text
              if (typeof item === 'object' && item !== null && 'str' in item) {
                return (item as { str: string }).str;
              }
              return '';
            })
            .join(' ');
          fullText += pageText + '\n';

          // Clean up page resources
          page.cleanup();
        }

        fileContent = fullText;

        // Clean up PDF document
        await pdf.cleanup();
      } catch (pdfError) {
        console.error('[Parser] PDF extraction failed:', pdfError);
        throw new Error(
          'Failed to read PDF document. The file may be corrupted, password-protected, or use an unsupported PDF version. Note: Scanned PDFs (images) are not supported.'
        );
      }
    } else if (fileExtension === '.docx') {
      // Extract raw text from Word document using mammoth
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        fileContent = result.value;
      } catch (mammothError) {
        console.error('[Parser] Mammoth extraction failed:', mammothError);
        throw new Error(
          'Failed to read Word document. The file may be corrupted or password-protected.'
        );
      }
    } else if (fileExtension === '.txt' || fileExtension === '.json') {
      // Read as plain text
      fileContent = await file.text();
    } else {
      throw new Error(
        'Unsupported file format. Please upload a .txt, .json, .docx, or .pdf file.'
      );
    }

    // Call existing parseOtterTranscript() with extracted text
    return parseOtterTranscript(fileContent, file.name);
  } catch (error) {
    // Re-throw if already a formatted error message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to parse file');
  }
}

/**
 * Parse Otter.ai transcript file (auto-detects format from fileName)
 *
 * @param fileContent - File content as string
 * @param fileName - File name (used to detect format: .txt, .json, .docx, or .pdf)
 * @returns ParsedTranscript with segments and metadata
 * @throws Error if file format is unsupported or parsing fails
 */
export function parseOtterTranscript(
  fileContent: string,
  fileName: string
): ParsedTranscript {
  // Detect format from file extension
  const extension = fileName
    .substring(fileName.lastIndexOf('.'))
    .toLowerCase();

  let format: TranscriptFormat;
  if (extension === '.json') {
    format = 'json';
  } else if (extension === '.docx') {
    format = 'docx';
  } else if (extension === '.pdf') {
    format = 'pdf';
  } else {
    format = 'txt';
  }

  // Parse based on format (docx and pdf have been converted to plain text by wrapper)
  let segments: TranscriptSegment[];
  if (format === 'json') {
    segments = parseOtterJsonFormat(fileContent);
  } else {
    // .txt, .docx, and .pdf all use same text format parsing
    segments = parseOtterTxtFormat(fileContent);
  }

  // Return parsed transcript with metadata
  return {
    segments,
    metadata: {
      totalSegments: segments.length,
      format,
      fileName,
    },
  };
}
/**
 * Parse Otter.ai text format (.txt)
 *
 * Text format structure:
 * ```
 * Speaker 1  0:03
 * This is the first segment of text.
 *
 * Speaker 2  0:15
 * This is a response from the second speaker.
 * ```
 *
 * @param content - File content as string
 * @returns Array of transcript segments
 * @throws Error if parsing fails
 */
export function parseOtterTxtFormat(content: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const lines = content.split('\n');

  let currentSpeaker: string | null = null;
  let currentTimestamp: string | null = null;
  let currentText: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines (they separate segments)
    if (line === '') {
      // Save previous segment if exists
      if (currentSpeaker && currentTimestamp && currentText.length > 0) {
        segments.push({
          speaker: currentSpeaker,
          timestamp: currentTimestamp,
          elapsed_time: currentTimestamp,
          text: currentText.join(' ').trim(),
        });
      }
      // Reset for next segment
      currentSpeaker = null;
      currentTimestamp = null;
      currentText = [];
      continue;
    }

    // Check if this line is a speaker/timestamp line
    // Pattern: "Speaker Name  HH:MM:SS" or "Speaker Name  MM:SS"
    // Uses multiple spaces or tab as separator
    const speakerTimestampMatch = line.match(/^(.+?)\s{2,}([\d:]+)$/);

    if (speakerTimestampMatch) {
      // Save previous segment if exists
      if (currentSpeaker && currentTimestamp && currentText.length > 0) {
        segments.push({
          speaker: currentSpeaker,
          timestamp: currentTimestamp,
          elapsed_time: currentTimestamp,
          text: currentText.join(' ').trim(),
        });
      }

      // Start new segment
      currentSpeaker = speakerTimestampMatch[1].trim();
      currentTimestamp = normalizeTimestamp(speakerTimestampMatch[2].trim());
      currentText = [];
    } else {
      // This is text content for current segment
      if (currentSpeaker && currentTimestamp) {
        currentText.push(line);
      }
    }
  }

  // Save last segment if exists
  if (currentSpeaker && currentTimestamp && currentText.length > 0) {
    segments.push({
      speaker: currentSpeaker,
      timestamp: currentTimestamp,
      elapsed_time: currentTimestamp,
      text: currentText.join(' ').trim(),
    });
  }

  // Handle edge case: no segments found
  if (segments.length === 0) {
    throw new Error(
      'No transcript segments found. Please check the file format.'
    );
  }

  // Handle edge case: missing timestamps (assign sequential timestamps)
  segments.forEach((segment, index) => {
    if (!segment.timestamp || segment.timestamp === '00:00:00') {
      segment.timestamp = normalizeTimestamp(index.toString());
    }
  });

  return segments;
}

/**
 * Parse Otter.ai JSON format (.json)
 *
 * JSON format structure:
 * ```json
 * {
 *   "segments": [
 *     {
 *       "speaker": "Speaker 1",
 *       "start_time": 3.5,
 *       "end_time": 12.8,
 *       "text": "This is the first segment."
 *     }
 *   ]
 * }
 * ```
 *
 * @param content - File content as string
 * @returns Array of transcript segments
 * @throws Error if JSON is malformed or parsing fails
 */
export function parseOtterJsonFormat(content: string): TranscriptSegment[] {
  try {
    const json: OtterJsonTranscript = JSON.parse(content);

    if (!json.segments || !Array.isArray(json.segments)) {
      throw new Error('Invalid JSON format: missing "segments" array');
    }

    const segments: TranscriptSegment[] = json.segments.map(
      (segment: OtterJsonSegment, index: number) => {
        // Extract speaker (default to "Unknown Speaker" if missing)
        const speaker =
          segment.speaker && segment.speaker.trim() !== ''
            ? segment.speaker.trim()
            : `Speaker ${index + 1}`;

        // Extract timestamp (convert numeric seconds to HH:MM:SS)
        const timestamp =
          segment.start_time !== undefined
            ? normalizeTimestamp(segment.start_time.toString())
            : normalizeTimestamp(index.toString());

        // Extract text content (default to empty string if missing)
        const text =
          segment.text && segment.text.trim() !== ''
            ? segment.text.trim()
            : '';

        return {
          speaker,
          timestamp,
          elapsed_time: timestamp,
          text,
        };
      }
    );

    // Filter out segments with empty text
    const validSegments = segments.filter(
      (segment) => segment.text.length > 0
    );

    if (validSegments.length === 0) {
      throw new Error(
        'No valid transcript segments found. All segments have empty text.'
      );
    }

    return validSegments;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        'Failed to parse JSON file. Please ensure the file is valid JSON.'
      );
    }
    throw error;
  }
}

/**
 * Normalize timestamp to HH:MM:SS format
 *
 * Handles multiple input formats:
 * - HH:MM:SS → "01:23:45"
 * - MM:SS → "00:01:23"
 * - M:SS → "00:01:23"
 * - Numeric seconds (string) → "00:01:23"
 * - Numeric seconds (from JSON) → "00:01:23"
 *
 * @param timestamp - Input timestamp in various formats
 * @returns Normalized timestamp in HH:MM:SS format
 */
export function normalizeTimestamp(timestamp: string): string {
  // Handle empty or invalid input
  if (!timestamp || timestamp.trim() === '') {
    return '00:00:00';
  }

  const trimmed = timestamp.trim();

  // Check if it's already in HH:MM:SS format (with optional leading zeros)
  const hhmmssMatch = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (hhmmssMatch) {
    const hours = parseInt(hhmmssMatch[1], 10);
    const minutes = parseInt(hhmmssMatch[2], 10);
    const seconds = parseInt(hhmmssMatch[3], 10);
    return formatTime(hours, minutes, seconds);
  }

  // Check if it's in MM:SS format
  const mmssMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (mmssMatch) {
    const minutes = parseInt(mmssMatch[1], 10);
    const seconds = parseInt(mmssMatch[2], 10);
    return formatTime(0, minutes, seconds);
  }

  // Try parsing as numeric seconds (string or number)
  const numericSeconds = parseFloat(trimmed);
  if (!isNaN(numericSeconds) && numericSeconds >= 0) {
    const totalSeconds = Math.floor(numericSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return formatTime(hours, minutes, seconds);
  }

  // Default: return 00:00:00 for unparseable timestamps
  console.warn(
    `[Parser] Could not parse timestamp "${timestamp}", using 00:00:00`
  );
  return '00:00:00';
}

/**
 * Format time components to HH:MM:SS string
 *
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59)
 * @param seconds - Seconds (0-59)
 * @returns Formatted time string (e.g., "01:23:45")
 */
function formatTime(hours: number, minutes: number, seconds: number): string {
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
