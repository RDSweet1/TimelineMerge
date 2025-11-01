'use client';

/**
 * TranscriptImporter Component
 *
 * Main component for importing transcript files in .txt, .json, and .docx formats.
 * Handles file upload, validation, and import workflow.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { importTranscript } from '@/actions/import';
import { readAndParseTranscriptFile } from '@/lib/import/transcript-parser';
import { InspectionSelector } from './InspectionSelector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function TranscriptImporter() {
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    const validExtensions = ['.txt', '.json', '.docx'];
    const fileExtension = selectedFile.name
      .substring(selectedFile.name.lastIndexOf('.'))
      .toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast.error('Invalid file type. Please upload a .txt, .json, or .docx file.');
      e.target.value = ''; // Clear the input
      return;
    }

    // Validate file size (< 100 MB)
    const maxSizeBytes = 100 * 1024 * 1024; // 100 MB
    if (selectedFile.size > maxSizeBytes) {
      toast.error('File is too large. Maximum size is 100 MB.');
      e.target.value = ''; // Clear the input
      return;
    }

    setFile(selectedFile);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    if (!selectedInspectionId) {
      toast.error('Please select an inspection');
      return;
    }

    setIsImporting(true);

    try {
      // File size warning for large files
      const warningSizeBytes = 10 * 1024 * 1024; // 10 MB
      if (file.size > warningSizeBytes) {
        toast.warning('Large file detected. This may take a moment to process.');
      }

      // Parse file using wrapper function (handles all formats client-side)
      const parsedTranscript = await readAndParseTranscriptFile(file);

      // Call Server Action with parsed transcript
      const result = await importTranscript(
        selectedInspectionId,
        parsedTranscript,
        file.name
      );

      if (result.success) {
        toast.success(
          `Successfully imported ${result.data.count} transcript segment${result.data.count === 1 ? '' : 's'}`
        );
        // Clear file input after successful import
        setFile(null);
        // Reset the file input element
        const fileInput = document.getElementById(
          'transcript-file'
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('[TranscriptImporter] Failed to parse file:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to parse file. Please try again.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Inspection Selection */}
      <InspectionSelector onInspectionSelected={setSelectedInspectionId} />

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Transcript File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transcript-file">
              Select transcript file (.txt, .json, or .docx)
            </Label>
            <Input
              id="transcript-file"
              type="file"
              accept=".txt,.json,.docx"
              onChange={handleFileChange}
              disabled={isImporting}
            />
          </div>

          {file && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Size: {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || !selectedInspectionId || isImporting}
            className="w-full"
          >
            {isImporting ? 'Importing...' : 'Import Transcript'}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Requirements:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>File format: .txt, .json, or .docx</li>
              <li>Maximum file size: 100 MB</li>
              <li>Warning displayed for files larger than 10 MB</li>
              <li>Must select an inspection before importing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
