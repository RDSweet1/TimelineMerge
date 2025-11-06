'use client';

/**
 * TranscriptImporter Component
 *
 * Main component for importing transcript files in .txt, .json, .docx, and .pdf formats.
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileIcon, X, Loader2, AlertCircle, Info } from 'lucide-react';

export function TranscriptImporter() {
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setValidationError(''); // Clear previous errors

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    const validExtensions = ['.txt', '.json', '.docx', '.pdf'];
    const fileExtension = selectedFile.name
      .substring(selectedFile.name.lastIndexOf('.'))
      .toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      setValidationError('Invalid file type. Please upload a .txt, .json, .docx, or .pdf file.');
      toast.error('Invalid file type. Please upload a .txt, .json, .docx, or .pdf file.');
      e.target.value = ''; // Clear the input
      return;
    }

    // Validate file size (< 100 MB)
    const maxSizeBytes = 100 * 1024 * 1024; // 100 MB
    if (selectedFile.size > maxSizeBytes) {
      setValidationError('File is too large. Maximum size is 100 MB.');
      toast.error('File is too large. Maximum size is 100 MB.');
      e.target.value = ''; // Clear the input
      return;
    }

    setFile(selectedFile);
  };

  const handleClearFile = () => {
    setFile(null);
    setValidationError('');
    const fileInput = document.getElementById('transcript-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const getTooltipMessage = () => {
    if (!selectedInspectionId && !file) return 'Please select an inspection and a file';
    if (!selectedInspectionId) return 'Please select an inspection';
    if (!file) return 'Please select a file';
    return '';
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
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="transcript-file">
              Select transcript file (.txt, .json, .docx, or .pdf)
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="transcript-file"
              type="file"
              accept=".txt,.json,.docx,.pdf"
              onChange={handleFileChange}
              disabled={isImporting}
              className={validationError ? 'border-destructive' : ''}
            />
            {validationError && (
              <div className="flex items-start gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{validationError}</p>
              </div>
            )}
          </div>

          {file && (
            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{file.name}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {file.size > 1024 * 1024
                          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                          : `${(file.size / 1024).toFixed(1)} KB`}
                      </span>
                      <span>•</span>
                      <span>{file.type || 'Unknown type'}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearFile}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button
                    onClick={handleImport}
                    disabled={!file || !selectedInspectionId || isImporting}
                    className="w-full"
                  >
                    {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isImporting ? 'Importing...' : 'Import Transcript'}
                  </Button>
                </div>
              </TooltipTrigger>
              {(!file || !selectedInspectionId) && !isImporting && (
                <TooltipContent>
                  <p>{getTooltipMessage()}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-sm font-semibold text-blue-900">Requirements</AlertTitle>
            <AlertDescription className="text-xs text-blue-800 leading-relaxed mt-2">
              <ul className="space-y-1.5 list-disc list-inside">
                <li>File format: .txt, .json, .docx, or .pdf</li>
                <li>Maximum file size: 100 MB</li>
                <li>Warning displayed for files larger than 10 MB</li>
                <li>Must select an inspection before importing</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
