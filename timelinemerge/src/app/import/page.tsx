'use client';

/**
 * Import Page
 *
 * Page for importing data (transcripts and photos) into inspections.
 */

import { TranscriptImporter } from '@/components/import/TranscriptImporter';
import { PhotoImporter } from '@/components/import/PhotoImporter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default function ImportPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <span>Import</span>
        </div>
        <h1 className="text-3xl font-bold">Import Data</h1>
        <p className="text-muted-foreground mt-2">
          Import transcripts or photos into your inspection timeline.
        </p>
      </div>

      {/* Import Tabs */}
      <Tabs defaultValue="transcript" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transcript">Transcript Import</TabsTrigger>
          <TabsTrigger value="photos">Photo Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transcript" className="mt-6">
          <TranscriptImporter />
        </TabsContent>
        
        <TabsContent value="photos" className="mt-6">
          <PhotoImporter />
        </TabsContent>
      </Tabs>
    </div>
  );
}
