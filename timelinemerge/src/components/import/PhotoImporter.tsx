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
import { InspectionSelector } from '@/components/import/InspectionSelector';
import { selectPhotoDirectory } from '@/lib/import/directory-picker';
import { extractPhotoMetadata } from '@/lib/import/photo-metadata';
import { importPhotos } from '@/actions/import';
import { PhotoMetadata } from '@/lib/import/types';

export function PhotoImporter() {
  const [inspectionId, setInspectionId] = useState<string>('');
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Select a directory containing inspection photos. Supported formats: JPG, JPEG, PNG
            </p>
            <Button
              onClick={handleSelectDirectory}
              disabled={isScanning}
              className="w-full sm:w-auto"
            >
              {isScanning ? 'Scanning Directory...' : 'Select Photo Directory'}
            </Button>
          </div>

          {photos.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium">
                  {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
                </p>
                <div className="mt-2 max-h-40 overflow-y-auto">
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
                onClick={handleImport}
                disabled={!inspectionId || isImporting}
                className="w-full sm:w-auto"
              >
                {isImporting ? 'Importing Photos...' : 'Import Photos'}
              </Button>
            </div>
          )}

          {!inspectionId && photos.length > 0 && (
            <p className="text-sm text-destructive">
              Please select an inspection before importing
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
