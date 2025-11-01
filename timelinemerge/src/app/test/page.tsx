'use client';

/**
 * Database Testing Page
 *
 * This temporary page is used to manually test database operations
 * for Story 1.2: Database Foundation
 *
 * DELETE THIS FILE after testing is complete
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  createProject,
  createInspection,
  createTranscriptItem,
  createPhotoItem,
  listProjects,
  getProject,
  getInspection,
  deleteProject,
} from '@/actions/projects';

export default function TestPage() {
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [testProjectId, setTestProjectId] = useState<string>('');
  const [testInspectionId, setTestInspectionId] = useState<string>('');

  const log = (message: string) => {
    setOutput((prev) => `${prev}\n${new Date().toLocaleTimeString()}: ${message}`);
    console.log(message);
  };

  const handleTest = async (testName: string, testFn: () => Promise<void>) => {
    setLoading(true);
    log(`\n=== Running: ${testName} ===`);
    try {
      await testFn();
      log(`✓ ${testName} completed`);
    } catch (error) {
      log(`✗ ${testName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateProject = async () => {
    const result = await createProject({
      name: 'Test Project',
      clientName: 'Test Client',
    });

    if (result.success) {
      setTestProjectId(result.data.id);
      log(`Created project: ${result.data.id}`);
      log(`Project name: ${result.data.name}`);
      log(`Client name: ${result.data.client_name}`);
    } else {
      log(`Error: ${result.error}`);
    }
  };

  const testListProjects = async () => {
    const result = await listProjects();

    if (result.success) {
      log(`Found ${result.data.length} projects`);
      result.data.forEach((project) => {
        log(`  - ${project.name} (${project.id})`);
      });
    } else {
      log(`Error: ${result.error}`);
    }
  };

  const testGetProject = async () => {
    if (!testProjectId) {
      log('No test project ID available. Create a project first.');
      return;
    }

    const result = await getProject(testProjectId);

    if (result.success) {
      log(`Retrieved project: ${result.data.name}`);
      log(`Created at: ${result.data.created_at}`);
    } else {
      log(`Error: ${result.error}`);
    }
  };

  const testCreateInspection = async () => {
    if (!testProjectId) {
      log('No test project ID available. Create a project first.');
      return;
    }

    const result = await createInspection({
      projectId: testProjectId,
      name: 'Test Inspection',
      inspectionDate: new Date().toISOString().split('T')[0],
      siteTypeSchema: 'commercial_v1',
    });

    if (result.success) {
      setTestInspectionId(result.data.id);
      log(`Created inspection: ${result.data.id}`);
      log(`Inspection name: ${result.data.name}`);
      log(`Site type: ${result.data.site_type_schema}`);
    } else {
      log(`Error: ${result.error}`);
    }
  };

  const testGetInspection = async () => {
    if (!testInspectionId) {
      log('No test inspection ID available. Create an inspection first.');
      return;
    }

    const result = await getInspection(testInspectionId);

    if (result.success) {
      log(`Retrieved inspection: ${result.data.name}`);
      log(`Project ID: ${result.data.project_id}`);
    } else {
      log(`Error: ${result.error}`);
    }
  };

  const testCreateTranscriptItem = async () => {
    if (!testInspectionId) {
      log('No test inspection ID available. Create an inspection first.');
      return;
    }

    const result = await createTranscriptItem({
      inspectionId: testInspectionId,
      indexPosition: 0,
      timestamp: new Date().toISOString(),
      speakerLabel: 'Inspector',
      textContent: 'This is a test transcript entry.',
    });

    if (result.success) {
      log(`Created transcript item: ${result.data.id}`);
      log(`Index position: ${result.data.index_position}`);
      log(`Speaker: ${result.data.speaker_label}`);
    } else {
      log(`Error: ${result.error}`);
    }
  };

  const testCreatePhotoItem = async () => {
    if (!testInspectionId) {
      log('No test inspection ID available. Create an inspection first.');
      return;
    }

    const result = await createPhotoItem({
      inspectionId: testInspectionId,
      indexPosition: 1,
      timestamp: new Date().toISOString(),
      filePath: '/uploads/test-photo.jpg',
      caption: 'Test photo caption',
      exifData: {
        make: 'Canon',
        model: 'EOS 5D',
        focalLength: '50mm',
      },
    });

    if (result.success) {
      log(`Created photo item: ${result.data.id}`);
      log(`Index position: ${result.data.index_position}`);
      log(`File path: ${result.data.file_path}`);
      log(`EXIF data: ${JSON.stringify(result.data.exif_data)}`);
    } else {
      log(`Error: ${result.error}`);
    }
  };

  const testDuplicateIndexPosition = async () => {
    if (!testInspectionId) {
      log('No test inspection ID available. Create an inspection first.');
      return;
    }

    // Try to create another item at position 0 (should fail)
    const result = await createTranscriptItem({
      inspectionId: testInspectionId,
      indexPosition: 0,
      textContent: 'This should fail due to duplicate position.',
    });

    if (result.success) {
      log('WARNING: Duplicate position was allowed (should have failed)');
    } else {
      log(`Expected error: ${result.error}`);
    }
  };

  const testDeleteProject = async () => {
    if (!testProjectId) {
      log('No test project ID available. Create a project first.');
      return;
    }

    const result = await deleteProject(testProjectId);

    if (result.success) {
      log(`Deleted project: ${testProjectId}`);
      log('All child inspections and items should be cascade deleted');
      setTestProjectId('');
      setTestInspectionId('');
    } else {
      log(`Error: ${result.error}`);
    }
  };

  const runAllTests = async () => {
    setOutput('');
    await handleTest('Create Project', testCreateProject);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await handleTest('List Projects', testListProjects);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await handleTest('Get Project', testGetProject);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await handleTest('Create Inspection', testCreateInspection);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await handleTest('Get Inspection', testGetInspection);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await handleTest('Create Transcript Item', testCreateTranscriptItem);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await handleTest('Create Photo Item', testCreatePhotoItem);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await handleTest('Test Duplicate Index Position', testDuplicateIndexPosition);
    await new Promise((resolve) => setTimeout(resolve, 500));
    log('\n=== All Tests Complete ===');
    log('Note: To test cascade delete, click "Delete Project" button');
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Database Testing Page</h1>
      <p className="text-muted-foreground mb-8">
        Story 1.2: Database Foundation - Manual Testing
      </p>

      <div className="space-y-4 mb-8">
        <div className="flex flex-wrap gap-2">
          <Button onClick={runAllTests} disabled={loading}>
            Run All Tests
          </Button>
          <Button
            onClick={() => handleTest('Create Project', testCreateProject)}
            disabled={loading}
            variant="outline"
          >
            1. Create Project
          </Button>
          <Button
            onClick={() => handleTest('List Projects', testListProjects)}
            disabled={loading}
            variant="outline"
          >
            2. List Projects
          </Button>
          <Button
            onClick={() => handleTest('Get Project', testGetProject)}
            disabled={loading}
            variant="outline"
          >
            3. Get Project
          </Button>
          <Button
            onClick={() => handleTest('Create Inspection', testCreateInspection)}
            disabled={loading}
            variant="outline"
          >
            4. Create Inspection
          </Button>
          <Button
            onClick={() => handleTest('Get Inspection', testGetInspection)}
            disabled={loading}
            variant="outline"
          >
            5. Get Inspection
          </Button>
          <Button
            onClick={() => handleTest('Create Transcript', testCreateTranscriptItem)}
            disabled={loading}
            variant="outline"
          >
            6. Create Transcript
          </Button>
          <Button
            onClick={() => handleTest('Create Photo', testCreatePhotoItem)}
            disabled={loading}
            variant="outline"
          >
            7. Create Photo
          </Button>
          <Button
            onClick={() => handleTest('Test Duplicate Position', testDuplicateIndexPosition)}
            disabled={loading}
            variant="outline"
          >
            8. Test Duplicate Position
          </Button>
          <Button
            onClick={() => handleTest('Delete Project (Cascade)', testDeleteProject)}
            disabled={loading}
            variant="destructive"
          >
            9. Delete Project
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setOutput('')} variant="ghost">
            Clear Output
          </Button>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Output</h2>
        <pre className="whitespace-pre-wrap text-sm font-mono">
          {output || 'No output yet. Click a test button to begin.'}
        </pre>
      </div>

      <div className="mt-8 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test IDs</h2>
        <p className="text-sm">
          <strong>Project ID:</strong> {testProjectId || 'Not created yet'}
        </p>
        <p className="text-sm">
          <strong>Inspection ID:</strong> {testInspectionId || 'Not created yet'}
        </p>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Ensure Supabase project is created and .env.local is configured</li>
          <li>Run the migration SQL in Supabase SQL Editor</li>
          <li>Click &quot;Run All Tests&quot; to execute the full test suite</li>
          <li>
            Verify in Supabase Table Editor that:
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Projects table has test data</li>
              <li>Inspections table has linked records</li>
              <li>Transcript_items and photo_items have correct index_positions</li>
              <li>Timeline_items VIEW is queryable</li>
            </ul>
          </li>
          <li>Test cascade delete by clicking &quot;Delete Project&quot; button</li>
          <li>Verify all child records are deleted in Supabase</li>
          <li>DELETE THIS FILE after testing is complete</li>
        </ol>
      </div>
    </div>
  );
}
