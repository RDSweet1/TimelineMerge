# Story 1.3.2: PDF Document Parser


# Story 1.3.2: PDF Document Parser

Status: ready-for-dev

## Story

As an inspector,
I want to import PDF documents (.pdf) containing transcript content,
So that I can work with transcripts stored in PDF format without manually converting them to .txt or .json files.

## Requirements Context Summary

Story 1.3.2 extends the transcript import functionality from Story 1.3 to support PDF document (.pdf) files in addition to the existing .txt, .json, and .docx formats. This story enables inspectors to upload PDF documents that contain transcript content and have them parsed into the same plain text format used by the existing transcript import workflow.

**Key Requirements:**
- Support .pdf file upload in addition to existing .txt/.json/.docx support
- Parse PDF document content into plain text transcript format (client-side only)
- Extract timestamps if present in document (via pattern matching)
- Handle PDF documents without timestamps gracefully
- Maintain existing transcript import workflow (inspection selection, parsing, storage)
- File size limit: 100 MB (with warning for files > 10 MB)
- Use pdf-parse or pdfjs-dist library for .pdf parsing (production dependency)
- Client-side wrapper function to handle format detection and parsing

**Sources:**
- [Source: Pattern from Story 1.3.1 Word Document Parser]
- [Source: docs/PRD.md#FR001-Transcript-Import]
- [Source: docs/architecture.md#Import-Module-Location]

## Structure Alignment Summary

**Previous Story Learnings:**

From Story 1.3.1: Word Document Parser (Status: done)

**Extension Pattern Established:**
- Client-side wrapper function: readAndParseTranscriptFile() in src/lib/import/transcript-parser.ts
- Format detection based on file extension (.txt, .json, .docx, and now .pdf)
- Library integration pattern: use extraction library to get plain text, then call parseOtterTranscript()
- parseOtterTranscript() signature unchanged (string-only, no breaking changes)
- TranscriptFormat type already renamed (OtterTranscriptFormat → TranscriptFormat)
- importTranscript() Server Action accepts ParsedTranscript (no changes needed)

**Import Infrastructure Available:**
- Import parser module exists at src/lib/import/transcript-parser.ts
- Import Server Action available at src/actions/import.ts with importTranscript()
- Import UI components available:
  - src/components/import/TranscriptImporter.tsx - File upload and import UI
  - src/components/import/InspectionSelector.tsx - Inspection selection/creation UI
- Import page route available at src/app/import/page.tsx
- Parser types defined in src/lib/import/types.ts (TranscriptSegment, ParsedTranscript, TranscriptFormat)
- File reading happens client-side using readAndParseTranscriptFile() wrapper
- Batch insert pattern established for performance
- UNIQUE constraint handling (code 23505) with user-friendly duplicate import messages
- Structured logging with [Import] prefix
- File size limit: 100 MB with warning at 10 MB threshold

**Key Patterns Established:**
- Server Actions return ActionResult<T> (never throw to client)
- Import workflow: file selection → parsing → validation → batch insert
- Client-side file type validation and file size validation (< 100 MB)
- Timestamp normalization to HH:MM:SS format (handled by parseOtterTranscript)
- Component files use PascalCase naming (TranscriptImporter.tsx)
- Library files use kebab-case naming (transcript-parser.ts)

**Important Notes:**
- Timestamps stored as NULL in database (database uses TIMESTAMPTZ but transcripts only have elapsed time)
- Ordering relies on index_position (adequate for MVP)
- Parser is pure function (no side effects, no DB access)
- All errors return ActionResult (never throw to client)

[Source: docs/stories/1-3-1-word-document-parser.md#Structure-Alignment-Summary]

**Extension Points for Story 1.3.2:**
- Update src/lib/import/transcript-parser.ts readAndParseTranscriptFile() to add .pdf support
- Update src/components/import/TranscriptImporter.tsx to accept .pdf files
- Add pdf-parse or pdfjs-dist dependency (production) for PDF document parsing
- Maintain compatibility with existing .txt, .json, and .docx parsing
- DO NOT modify parseOtterTranscript() signature - keep it string-only
- DO NOT modify importTranscript() Server Action - no changes needed

## Acceptance Criteria

1. File upload interface accepts .pdf files in addition to .txt, .json, and .docx
2. Client-side file type validation enforced (.txt, .json, .docx, .pdf only) with clear error messages
3. Client-side file size validation enforced (< 100 MB) with clear error messages
4. Parser extracts plain text content from PDF document using pdf-parse or pdfjs-dist (client-side only)
5. Parser attempts to extract timestamps from document content using pattern matching
6. Parser handles PDF documents without timestamps gracefully (assigns sequential timestamps or uses fallback)
7. Parsed PDF document content follows same format as existing transcript parsing (TranscriptSegment array)
8. PDF document transcripts stored using existing importTranscript() Server Action (NO changes to Server Action)
9. Import success/failure feedback displayed to user (same as existing transcript import)
10. Handle parsing errors gracefully with specific error messages for PDF document failures
11. Display warning if .pdf file size > 10 MB
12. All parsing (including .pdf) happens client-side before calling importTranscript()

## Tasks / Subtasks

- [ ] **Task 1: Install PDF Parsing Library Dependency** (AC: #4)
  - [ ] Research and select PDF parsing library (pdf-parse or pdfjs-dist)
  - [ ] Install chosen package as production dependency: `npm install pdf-parse` or `npm install pdfjs-dist`
  - [ ] Install type definitions if needed: `npm install --save-dev @types/pdf-parse` (if available)
  - [ ] Verify library is browser-compatible (runs in client-side code)
  - [ ] Note: Consider bundle size impact when choosing library

- [ ] **Task 2: Update Parser Types** (AC: #7)
  - [ ] Update src/lib/import/types.ts TranscriptFormat union to add 'pdf'
  - [ ] Change from: 'txt' | 'json' | 'docx'
  - [ ] Change to: 'txt' | 'json' | 'docx' | 'pdf'
  - [ ] Verify TranscriptSegment and ParsedTranscript types work with .pdf format
  - [ ] No other type changes needed (format already renamed to TranscriptFormat in Story 1.3.1)

- [ ] **Task 3: Extend Client-Side Wrapper Function** (AC: #4, #5, #6, #7, #12)
  - [ ] Update readAndParseTranscriptFile() wrapper function in src/lib/import/transcript-parser.ts
  - [ ] Add .pdf file extension detection to existing switch/if logic
  - [ ] If .pdf: use pdf-parse or pdfjs-dist to extract plain text, then call parseOtterTranscript() with extracted text
  - [ ] If .txt/.json/.docx: maintain existing logic (no changes)
  - [ ] Return ParsedTranscript from parseOtterTranscript()
  - [ ] DO NOT change parseOtterTranscript() signature - it remains (fileContent: string, fileName: string)
  - [ ] Add error handling for PDF parsing failures with specific message: "Failed to read PDF document. The file may be corrupted, password-protected, or use an unsupported PDF version."
  - [ ] Handle extraction errors gracefully with descriptive messages

- [ ] **Task 4: Verify Timestamp Fallback** (AC: #5, #6)
  - [ ] Verify parseOtterTranscript() function handles documents with NO timestamps gracefully
  - [ ] Confirm sequential timestamp assignment (00:00:00, 00:00:01, 00:00:02, ...) for documents without timestamps
  - [ ] Test with PDF documents containing no timestamps
  - [ ] Reuse existing normalizeTimestamp() function for timestamp normalization
  - [ ] NO changes to parseOtterTranscript() needed (already implemented in Story 1.3.1)

- [ ] **Task 5: Update TranscriptImporter Component** (AC: #1, #2, #3, #9, #11, #12)
  - [ ] Update src/components/import/TranscriptImporter.tsx file input accept attribute
  - [ ] Change accept=".txt,.json,.docx" to accept=".txt,.json,.docx,.pdf"
  - [ ] Update client-side file type validation to include .pdf extension
  - [ ] Update validExtensions array: ['.txt', '.json', '.docx', '.pdf']
  - [ ] Verify readAndParseTranscriptFile(file) wrapper handles .pdf format (should work from Task 3)
  - [ ] Maintain file size warning: if file.size > 10 MB, display warning toast before proceeding
  - [ ] Maintain file size validation: reject files > 100 MB with error message
  - [ ] Update error messages to mention .pdf as valid format
  - [ ] All parsing happens client-side before calling importTranscript()

- [ ] **Task 6: Verify Import Server Action Compatibility** (AC: #8)
  - [ ] Review src/actions/import.ts importTranscript() function
  - [ ] Verify it accepts ParsedTranscript result from wrapper function (should work without changes)
  - [ ] NO changes should be needed to importTranscript() signature or implementation
  - [ ] Ensure batch insert works with .pdf parsed segments (same as .txt/.json/.docx)
  - [ ] Verify structured logging includes .pdf format information (from fileName parameter)
  - [ ] Verify error handling works for .pdf parsing failures

- [ ] **Task 7: Test PDF Document Import Workflow** (AC: #1-12)
  - [ ] Create test .pdf file with transcript content and timestamps
  - [ ] Create test .pdf file without timestamps (fallback test)
  - [ ] Create password-protected .pdf file (error handling test)
  - [ ] Create .pdf file with images and tables (parsing test)
  - [ ] Create scanned image .pdf file (OCR limitation test - should show clear error)
  - [ ] Test file upload: select .pdf file, verify UI updates
  - [ ] Test file type validation: attempt to upload unsupported file, verify error message
  - [ ] Test file size validation: verify 100 MB limit enforced
  - [ ] Test file size warning: upload 15 MB .pdf, verify warning toast displayed
  - [ ] Test .pdf parsing: upload PDF document, verify text extracted correctly
  - [ ] Test timestamp extraction: verify timestamps found and normalized to HH:MM:SS
  - [ ] Test timestamp fallback: verify sequential timestamps assigned when none found
  - [ ] Test password-protected .pdf: verify specific error message displayed
  - [ ] Test scanned .pdf: verify clear error message about OCR not being supported
  - [ ] Test import: verify items created in transcript_items table
  - [ ] Test chronological ordering: verify index_position assigned correctly
  - [ ] Test duplicate import: verify error handling works same as .txt/.json/.docx
  - [ ] Test malformed .pdf: upload corrupted file, verify error message displayed
  - [ ] Test backward compatibility: verify .txt, .json, and .docx imports still work correctly

## Dev Notes

### Architecture Patterns

**Extension Pattern:**

This story extends existing functionality rather than creating new components. The extension pattern follows these principles:

1. **Minimal Changes:** Only modify files that need .pdf support
2. **Backward Compatibility:** Existing .txt, .json, and .docx parsing must continue working
3. **Type Safety:** Update TypeScript types to reflect new format support
4. **Consistent Patterns:** Follow same error handling, logging, and validation patterns
5. **Client-Side Parsing:** ALL parsing (including .pdf) happens client-side before Server Action call

**Files to Modify:**
- package.json - Add pdf-parse or pdfjs-dist dependency
- src/lib/import/types.ts - Add 'pdf' to TranscriptFormat union
- src/lib/import/transcript-parser.ts - Extend readAndParseTranscriptFile() wrapper function
- src/components/import/TranscriptImporter.tsx - Update file input and validation to include .pdf

**Files NOT to Modify:**
- src/actions/import.ts - NO changes needed (wrapper handles all format detection client-side)
- src/components/import/InspectionSelector.tsx - No changes needed
- src/app/import/page.tsx - No changes needed
- Database schema - No changes needed

[Source: docs/architecture.md#Import-Module-Location]

### PDF Document Parsing Library Options

**Library Comparison:**

Two primary options for parsing PDF files in the browser:

**Option 1: pdf-parse**
- **Pros:** Simple API, small bundle size, easy to use
- **Cons:** May not be browser-compatible (primarily Node.js library)
- **Usage:** `const data = await pdfParse(buffer); const text = data.text;`
- **Bundle Size:** ~50 KB (estimated)
- **Browser Support:** LIMITED - primarily designed for Node.js

**Option 2: pdfjs-dist (Mozilla PDF.js)**
- **Pros:** Browser-compatible, robust, widely used, actively maintained
- **Cons:** Larger bundle size, more complex API
- **Usage:** Requires loading document, getting pages, extracting text from each page
- **Bundle Size:** ~500 KB (larger than mammoth.js)
- **Browser Support:** EXCELLENT - designed for browser use

**Recommendation: pdfjs-dist (Mozilla PDF.js)**

Based on browser compatibility requirements and active maintenance, pdfjs-dist is recommended for this story.

**Installation:**

```bash
npm install pdfjs-dist
```

**Usage Pattern - Client-Side Wrapper Function Extension:**

```typescript
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

async function readAndParseTranscriptFile(file: File): Promise<ParsedTranscript> {
  try {
    let fileContent: string;

    // Check file extension
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (fileExtension === '.pdf') {
      // Extract text from PDF document
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      fileContent = fullText;
    } else if (fileExtension === '.docx') {
      // Existing mammoth.js logic
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      fileContent = result.value;
    } else if (fileExtension === '.txt' || fileExtension === '.json') {
      // Read as plain text
      fileContent = await file.text();
    } else {
      throw new Error('Unsupported file format');
    }

    // Call existing parseOtterTranscript() with extracted text
    return parseOtterTranscript(fileContent, file.name);

  } catch (error) {
    if (error instanceof Error && error.message.includes('PDF')) {
      throw new Error('Failed to read PDF document. The file may be corrupted, password-protected, or use an unsupported PDF version.');
    }
    throw error;
  }
}
```

**Important Notes:**
- pdfjs-dist requires worker configuration for production use
- PDF parsing may be slower than .txt/.json/.docx due to page-by-page extraction
- Scanned PDFs (images) will NOT work - text-based PDFs only (OCR not supported in MVP)
- Password-protected PDFs will fail with specific error message
- Client-side parsing happens before Server Action call
- Result is plain text string - then call existing parseOtterTranscript()
- PDF documents may or may not have timestamps - handle both cases
- DO NOT change parseOtterTranscript() signature - keep it string-only

**Alternative: pdf-parse (if browser-compatible version exists)**

If pdf-parse has a browser-compatible version or can be bundled properly:

```typescript
import pdfParse from 'pdf-parse';

if (fileExtension === '.pdf') {
  const arrayBuffer = await file.arrayBuffer();
  const data = await pdfParse(Buffer.from(arrayBuffer));
  fileContent = data.text;
}
```

**Decision:** Validate browser compatibility during Task 1. Prefer pdfjs-dist for guaranteed browser support.

[Source: https://mozilla.github.io/pdf.js/]
[Source: https://www.npmjs.com/package/pdf-parse]

### Timestamp Extraction Strategy

**Pattern Matching:**

PDF documents may contain timestamps in various formats:

1. **Otter.ai-style:** "Speaker 1  0:03" (speaker label + timestamp)
2. **Interview-style:** "[00:03:45] Speaker: text" (timestamp in brackets)
3. **Manual format:** "3:45 - Some text" (timestamp + dash)
4. **No timestamps:** Plain text without any time markers

**Extraction Logic:**

```typescript
// Reuse existing timestamp patterns from parseOtterTxtFormat
// Pattern 1: Speaker Name  MM:SS or HH:MM:SS
const otterPattern = /^(.+?)\s{2,}(\d{1,2}:\d{2}(?::\d{2})?)$/;

// Pattern 2: [HH:MM:SS] or [MM:SS]
const bracketPattern = /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]/;

// Pattern 3: MM:SS - or HH:MM:SS -
const dashPattern = /^(\d{1,2}:\d{2}(?::\d{2})?)\s*-/;

// If NO patterns match, assign sequential timestamps
if (!timestampFound) {
  segments.forEach((segment, index) => {
    segment.timestamp = normalizeTimestamp(index.toString()); // "00:00:00", "00:00:01", etc.
  });
}
```

**Fallback Strategy:**

If no timestamps are found in the PDF document:
- Assign sequential timestamps starting from 00:00:00
- Increment by 1 second for each segment
- This ensures items have valid timestamps for ordering
- User can manually edit timestamps later if needed
- **CRITICAL:** Existing implementation from Story 1.3.1 already handles this

[Source: docs/stories/1-3-1-word-document-parser.md#Timestamp-Extraction-Strategy]

### Client-Side Parsing Architecture

**Extension of Existing Pattern:**

Story 1.3.1 established the readAndParseTranscriptFile() wrapper function pattern. Story 1.3.2 extends this pattern to include .pdf support:

**Architecture:**
- Extend `readAndParseTranscriptFile(file: File)` wrapper function
- Add .pdf format detection branch to existing logic
- If .pdf: use pdfjs-dist or pdf-parse to extract text, then call parseOtterTranscript()
- If .docx: existing mammoth.js logic (no changes)
- If .txt/.json: existing file.text() logic (no changes)
- parseOtterTranscript() signature DOES NOT change - remains string-based
- importTranscript() Server Action DOES NOT need changes

**Benefits:**
- Maintains backward compatibility with existing Server Action
- Keeps parseOtterTranscript() as pure string-based function
- Centralizes format detection in wrapper function
- Avoids increasing server bundle size
- Follows established pattern from Stories 1.3 and 1.3.1

**Implementation in TranscriptImporter.tsx:**

```typescript
import { readAndParseTranscriptFile } from '@/lib/import/transcript-parser';

const handleImport = async () => {
  if (!file || !inspectionId) return;

  setIsImporting(true);

  try {
    // File size warning for large files
    if (file.size > 10 * 1024 * 1024) {
      toast.warning('Large file detected. This may take a moment to process.');
    }

    // Parse file using wrapper function (handles all formats client-side)
    const parsedTranscript = await readAndParseTranscriptFile(file);

    // Call existing Server Action with parsed result
    const result = await importTranscript(inspectionId, parsedTranscript, file.name);

    if (result.success) {
      toast.success(`Imported ${result.data.count} transcript segments`);
      setFile(null);
    } else {
      toast.error(result.error);
    }
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('Failed to parse file');
    }
  } finally {
    setIsImporting(false);
  }
};
```

**Key Points:**
- NO changes to importTranscript() Server Action signature
- All format detection happens in wrapper function
- parseOtterTranscript() remains pure string-based function
- Wrapper provides clean abstraction for file format handling

[Source: docs/stories/1-3-1-word-document-parser.md#Client-Side-Parsing-Architecture]

### File Size Limit and Warnings

**File Size Limits:**
- Maximum file size: 100 MB (hard limit, rejection with error)
- Warning threshold: 10 MB (display warning toast but allow processing)

**Rationale:**
- PDF documents can be significantly larger than plain text files
- PDFs with images, fonts, and embedded content require more space
- Text-based PDFs are typically smaller, but may still exceed 10 MB
- 100 MB accommodates most inspection transcripts
- Still reasonable for client-side parsing
- Warning at 10 MB helps set user expectations for processing time

**Validation:**

```typescript
// Client-side validation in TranscriptImporter.tsx
const maxSizeBytes = 100 * 1024 * 1024; // 100 MB
const warningSizeBytes = 10 * 1024 * 1024; // 10 MB

if (selectedFile.size > maxSizeBytes) {
  toast.error('File is too large. Maximum size is 100 MB.');
  return;
}

if (selectedFile.size > warningSizeBytes) {
  toast.warning('Large file detected. This may take a moment to process.');
}
```

[Source: docs/stories/1-3-1-word-document-parser.md#File-Size-Limit-and-Warnings]

### Testing Standards

**Manual Testing Required:**

Per architecture.md, this story requires manual testing of the PDF document import workflow:

**Test Scenarios:**
1. **Basic .pdf import:** PDF document with timestamps → verify parsing and import
2. **No timestamps:** PDF document without timestamps → verify fallback to sequential timestamps
3. **Speaker labels:** PDF document with speaker labels → verify extraction
4. **File validation:** Upload unsupported file → verify rejection with error message
5. **File size:** Upload 100+ MB file → verify rejection
6. **File size warning:** Upload 15 MB file → verify warning toast displayed
7. **Large file:** Upload 50 MB .pdf → verify warning and successful processing
8. **Backward compatibility:** Upload .txt file → verify existing functionality works
9. **Backward compatibility:** Upload .json file → verify existing functionality works
10. **Backward compatibility:** Upload .docx file → verify existing functionality works
11. **Malformed .pdf:** Upload corrupted PDF file → verify specific error message
12. **Password-protected .pdf:** Upload password-protected file → verify specific error message
13. **Scanned .pdf:** Upload scanned image PDF → verify clear error message (OCR not supported)
14. **Images/tables .pdf:** Upload .pdf with images and tables → verify text extraction
15. **Database verification:** Check transcript_items table → verify items inserted correctly
16. **Duplicate import:** Re-import same .pdf → verify error handling

**Test Data:**
- Create sample .pdf files for testing
- Include one with Otter.ai-style timestamps
- Include one without any timestamps
- Include one with speaker labels
- Create a corrupted .pdf file for error testing
- Create a password-protected .pdf file for error testing
- Create a scanned image .pdf file for OCR limitation testing
- Create a .pdf with images and tables for parsing testing

**Important Note on Scanned PDFs:**
- Scanned PDFs (images) will NOT work with text extraction
- OCR (Optical Character Recognition) is NOT supported in MVP
- Clear error message should indicate text-based PDFs only
- Future story may add OCR support if needed

**Future Testing:**
- Subsequent stories may add automated unit tests for parser
- Integration tests for end-to-end import workflow

[Source: docs/architecture.md#Development-Environment-Setup]

### Learnings from Previous Stories

**From Story 1.3: Otter.ai Transcript Import (Status: done)**

- **Import Module Location:** src/lib/import/ contains parser and types
- **Server Action Pattern:** src/actions/import.ts with importTranscript() follows ActionResult<T> pattern
- **Component Structure:** src/components/import/ with TranscriptImporter and InspectionSelector
- **File Reading:** Client-side using readAndParseTranscriptFile() wrapper
- **Batch Insert:** Single query for all segments (not loop)
- **Error Handling:** UNIQUE constraint violations (code 23505) handled with user-friendly messages
- **Logging:** Structured logging with [Import] prefix
- **Timestamp Storage:** Database stores NULL for timestamps (ordering by index_position)
- **File Size Limit:** 100 MB with warning at 10 MB
- **Naming Conventions:** Component files use PascalCase, library files use kebab-case

**From Story 1.3.1: Word Document Parser (Status: done)**

- **Client-Side Wrapper Pattern:** readAndParseTranscriptFile() wrapper function established
- **Library Integration:** Use extraction library (mammoth.js) to get plain text, then call parseOtterTranscript()
- **Type Naming:** OtterTranscriptFormat renamed to TranscriptFormat
- **Format Detection:** Based on file extension in wrapper function
- **parseOtterTranscript() Signature:** Unchanged (string-only, no breaking changes)
- **Timestamp Fallback:** Already implemented for documents without timestamps
- **Error Messages:** Specific error messages for library failures
- **File Size Warning:** Toast notification at 10 MB threshold
- **Production Dependency:** mammoth.js added as production dependency (~100 KB)

**Key Interfaces to Reuse:**
- `readAndParseTranscriptFile(file: File): Promise<ParsedTranscript>` - Wrapper entry point (EXTEND for .pdf)
- `parseOtterTranscript(fileContent: string, fileName: string): ParsedTranscript` - Main parser (DO NOT CHANGE)
- `normalizeTimestamp(timestamp: string | number): string` - Converts various timestamp formats to HH:MM:SS
- `importTranscript(inspectionId: string, parsedTranscript: ParsedTranscript, fileName: string): Promise<ActionResult<{ count: number }>>` - Import Server Action (NO CHANGES NEEDED)

**Files Created in Story 1.3:**
- src/lib/import/types.ts - Parser types
- src/lib/import/transcript-parser.ts - Parser implementation
- src/actions/import.ts - Import Server Action
- src/components/import/TranscriptImporter.tsx - File upload UI
- src/components/import/InspectionSelector.tsx - Inspection selection UI
- src/app/import/page.tsx - Import page route

**Files Modified in Story 1.3.1:**
- src/lib/import/types.ts - Renamed OtterTranscriptFormat to TranscriptFormat, added 'docx'
- src/lib/import/transcript-parser.ts - Added readAndParseTranscriptFile() wrapper
- src/components/import/TranscriptImporter.tsx - Updated to accept .docx, use wrapper function
- src/actions/import.ts - Updated to accept ParsedTranscript instead of file content string

**Technical Debt:**
- Timestamps stored as NULL (future story may add elapsed_time TEXT field)
- JSON format tested in code but not in browser
- Toast notifications for errors may disappear quickly
- Bundle size impact of multiple parsing libraries (mammoth.js ~100 KB, pdfjs-dist ~500 KB)

[Source: docs/stories/1-3-1-word-document-parser.md#Learnings-from-Previous-Story]

### Project Structure Notes

**Alignment with Existing Structure:**

Story 1.3.2 modifies existing files from Stories 1.3 and 1.3.1:

```
timelinemerge/
├── package.json                          # MODIFIED - Add pdfjs-dist dependency (production)
├── src/
│   ├── lib/
│   │   └── import/
│   │       ├── types.ts                  # MODIFIED - Add 'pdf' to TranscriptFormat union
│   │       └── transcript-parser.ts      # MODIFIED - Extend readAndParseTranscriptFile() for .pdf
│   └── components/
│       └── import/
│           └── TranscriptImporter.tsx    # MODIFIED - Accept .pdf, validate .pdf extension
```

**No Changes to Server Action:**

- src/actions/import.ts - NO modifications needed (wrapper handles all client-side parsing)

**No New Files Created:**

This story extends existing functionality by modifying 4 files only. No new components or routes needed.

**Dependency Addition:**

- pdfjs-dist (production dependency, ~500 KB bundle size)
- Consider bundle size impact when combining with existing dependencies

[Source: docs/architecture.md#Project-Structure]

### References

- [Source: docs/stories/1-3-1-word-document-parser.md] - Previous story with established extension pattern
- [Source: docs/stories/story-1.3.md] - Original transcript import story with core patterns
- [Source: docs/architecture.md#Import-Module-Location] - Import module architecture
- [Source: docs/architecture.md#Import-Patterns] - Import workflow pattern
- [Source: docs/PRD.md#FR001] - Transcript import functional requirement
- [Source: https://mozilla.github.io/pdf.js/] - Mozilla PDF.js (pdfjs-dist) documentation
- [Source: https://www.npmjs.com/package/pdf-parse] - pdf-parse library (alternative)

## Dev Agent Record

### Context Reference

- Story context file will be generated as: docs/stories/story-context-1.3.2.xml

### Agent Model Used

To be determined when story is picked up for development

### Debug Log References

To be added during development

### File List

**Files to be Modified:**
- timelinemerge/package.json - Add pdfjs-dist production dependency
- timelinemerge/src/lib/import/types.ts - Add 'pdf' to TranscriptFormat union
- timelinemerge/src/lib/import/transcript-parser.ts - Extend readAndParseTranscriptFile() wrapper for .pdf support
- timelinemerge/src/components/import/TranscriptImporter.tsx - Update to accept .pdf files, validate .pdf extension

**New Files:**
- None (extension of existing functionality)

## Change Log

**2025-11-01:** Story created by SM agent (create-story workflow) - Story 1.3.2 drafted to extend transcript import functionality with PDF document (.pdf) support. Uses pdfjs-dist for client-side parsing, maintains backward compatibility with .txt, .json, and .docx formats, follows established import patterns from Stories 1.3 and 1.3.1. Story follows exact same extension pattern as Story 1.3.1 but for PDF documents instead of Word documents.

---

**Date:** 2025-11-01
**Agent:** Scrum Master (SM - Bob)
**Status:** Story Drafted

**Creation Notes:** Story 1.3.2 drafted following the exact same structure and pattern as Story 1.3.1. All sections mirror the Word Document Parser story but adapted for PDF documents. Key differences:
- Library choice: pdfjs-dist instead of mammoth.js (browser-compatible, larger bundle ~500 KB)
- Additional testing scenario: scanned PDF (OCR limitation)
- Specific error message addresses corrupted, password-protected, or unsupported PDF versions
- Extension of existing readAndParseTranscriptFile() wrapper function (no new wrapper needed)

Story is ready for architect review and subsequent story-ready workflow execution.
