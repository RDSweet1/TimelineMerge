'use client';

/**
 * Photo Importer Component
 *
 * Provides UI for importing photos from a directory using File System Access API.
 * Extracts EXIF metadata and imports photos linked to an inspection.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InspectionSelector } from '@/components/import/InspectionSelector';
import { selectPhotoDirectory } from '@/lib/import/directory-picker';
import { extractPhotoMetadata } from '@/lib/import/photo-metadata';
import { importPhotos } from '@/actions/import';
import { PhotoMetadata } from '@/lib/import/types';
import { FolderOpen, Loader2, Info, X } from 'lucide-react';

export function PhotoImporter() {
  const [inspectionId, setInspectionId] = useState<string>('');
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleClearPhotos = () => {
    setPhotos([]);
  };

  const getImportTooltipMessage = () => {
    if (!inspectionId && photos.length === 0) return 'Please select an inspection and photos';
    if (!inspectionId) return 'Please select an inspection';
    if (photos.length === 0) return 'Please select photos';
    return '';
  };

  const handleSelectDirectory = async () => {
    setIsScanning(true);
    try {
      // Use File System Access API to select directory
      const photoFiles = await selectPhotoDirectory();

      if (photoFiles.length === 0) {
        toast.info('No photos selected or no supported photos found');
        setIsScanning(false);
        return;
      }

      toast.info(`Extracting metadata from ${photoFiles.length} photos...`);

      // Extract EXIF metadata from all photos in parallel
      const metadataPromises = photoFiles.map(({ file }) =>
        extractPhotoMetadata(file)
      );
      const photoMetadata = await Promise.all(metadataPromises);

      setPhotos(photoMetadata);
      toast.success(`Found ${photoMetadata.length} photos`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Permission denied. Please allow directory access.');
        } else if (error.name === 'NotSupportedError') {
          toast.error(
            'File System Access API not supported in this browser. Please use Chrome or Edge.'
          );
        } else {
          toast.error(error.message || 'Failed to read directory');
        }
      } else {
        toast.error('Failed to read directory');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleImport = async () => {
    if (!photos.length || !inspectionId) {
      return;
    }

    setIsImporting(true);
    try {
      const result = await importPhotos(inspectionId, photos);

      if (result.success) {
        toast.success(`Imported ${result.data.count} photos`);
        setPhotos([]);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to import photos');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Inspection Selection */}
      <InspectionSelector onInspectionSelected={setInspectionId} />

      {/* Photo Selection and Import */}
      <Card>
        <CardHeader>
          <CardTitle>Import Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Select a directory containing inspection photos. Supported formats: JPG, JPEG, PNG
            </p>
            <Button
              onClick={handleSelectDirectory}
              disabled={isScanning}
              className="w-full sm:w-auto"
            >
              {isScanning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isScanning && <FolderOpen className="mr-2 h-4 w-4" />}
              {isScanning ? 'Scanning Directory...' : 'Select Photo Directory'}
            </Button>
          </div>

          {photos.length > 0 && (
            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium">
                      {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="max-h-40 overflow-y-auto">
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {photos.slice(0, 10).map((photo, index) => (
                          <li key={index} className="truncate">
                            {photo.fileName}
                          </li>
                        ))}
                        {photos.length > 10 && (
                          <li className="italic">
                            ... and {photos.length - 10} more
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearPhotos}
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
                <div className="w-full sm:w-auto">
                  <Button
                    onClick={handleImport}
                    disabled={!inspectionId || photos.length === 0 || isImporting}
                    className="w-full sm:w-auto"
                  >
                    {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isImporting ? 'Importing Photos...' : 'Import Photos'}
                  </Button>
                </div>
              </TooltipTrigger>
              {(!inspectionId || photos.length === 0) && !isImporting && (
                <TooltipContent>
                  <p>{getImportTooltipMessage()}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-sm font-semibold text-blue-900">Requirements</AlertTitle>
            <AlertDescription className="text-xs text-blue-800 leading-relaxed mt-2">
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Supported photo formats: JPG, JPEG, PNG</li>
                <li>EXIF metadata will be automatically extracted</li>
                <li>Timestamps extracted from EXIF DateTimeOriginal</li>
                <li>Must select an inspection before importing</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
