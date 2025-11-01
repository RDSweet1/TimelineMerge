import { TranscriptImporter } from '@/components/import/TranscriptImporter';
import Link from 'next/link';

/**
 * Import Page
 *
 * Page for importing Otter.ai transcript files into inspections.
 */
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
        <h1 className="text-3xl font-bold">Import Transcript</h1>
        <p className="text-muted-foreground mt-2">
          Upload an Otter.ai transcript file to import spoken observations into
          your inspection.
        </p>
      </div>

      {/* Import Component */}
      <TranscriptImporter />
    </div>
  );
}
