'use client';

/**
 * InspectionSelector Component
 *
 * Allows users to select an existing inspection or create a new one for transcript import.
 * Requires a projectId to load inspections from the correct project.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  createInspection,
  listInspectionsByProject,
  listProjects,
} from '@/actions/projects';
import { Inspection, Project } from '@/types/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InspectionSelectorProps {
  onInspectionSelected: (inspectionId: string) => void;
}

export function InspectionSelector({
  onInspectionSelected,
}: InspectionSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>('');
  const [showCreateInspection, setShowCreateInspection] = useState(false);
  const [newInspectionName, setNewInspectionName] = useState('');
  const [isCreatingInspection, setIsCreatingInspection] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingInspections, setIsLoadingInspections] = useState(false);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load inspections when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      loadInspections(selectedProjectId);
    } else {
      setInspections([]);
      setSelectedInspectionId('');
      setShowCreateInspection(false);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    const result = await listProjects();

    if (result.success) {
      setProjects(result.data);
      // Auto-select first project if available
      if (result.data.length > 0) {
        setSelectedProjectId(result.data[0].id);
      }
    } else {
      toast.error('Failed to load projects');
    }
    setIsLoadingProjects(false);
  };

  const loadInspections = async (projectId: string) => {
    setIsLoadingInspections(true);
    setShowCreateInspection(false);
    setSelectedInspectionId('');

    const result = await listInspectionsByProject(projectId);

    if (result.success) {
      setInspections(result.data);
    } else {
      toast.error('Failed to load inspections');
      setInspections([]);
    }
    setIsLoadingInspections(false);
  };

  const handleInspectionChange = (value: string) => {
    if (value === '__create_new__') {
      setShowCreateInspection(true);
      setSelectedInspectionId('');
    } else {
      setShowCreateInspection(false);
      setSelectedInspectionId(value);
      onInspectionSelected(value);
    }
  };

  const handleCreateInspection = async () => {
    if (!newInspectionName.trim()) {
      toast.error('Inspection name is required');
      return;
    }

    if (!selectedProjectId) {
      toast.error('Project must be selected');
      return;
    }

    setIsCreatingInspection(true);

    const result = await createInspection({
      projectId: selectedProjectId,
      name: newInspectionName.trim(),
    });

    if (result.success) {
      toast.success('Inspection created successfully');
      setSelectedInspectionId(result.data.id);
      onInspectionSelected(result.data.id);
      setNewInspectionName('');
      setShowCreateInspection(false);
      // Reload inspections to include the new one
      await loadInspections(selectedProjectId);
    } else {
      toast.error(result.error);
    }

    setIsCreatingInspection(false);
  };

  if (isLoadingProjects) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Inspection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Inspection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No projects found. Please create a project first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Inspection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Selection */}
        <div className="space-y-2">
          <Label htmlFor="project-select">
            Project <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger id="project-select" aria-label="Select project">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                  {project.client_name && ` (${project.client_name})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Inspection Selection */}
        {selectedProjectId && (
          <div className="space-y-2">
            <Label htmlFor="inspection-select">
              Inspection <span className="text-destructive">*</span>
            </Label>
            {isLoadingInspections ? (
              <p className="text-sm text-muted-foreground">
                Loading inspections...
              </p>
            ) : (
              <Select
                value={selectedInspectionId}
                onValueChange={handleInspectionChange}
              >
                <SelectTrigger id="inspection-select" aria-label="Select inspection">
                  <SelectValue placeholder="Select or create an inspection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__create_new__">
                    + Create New Inspection
                  </SelectItem>
                  {inspections.map((inspection) => (
                    <SelectItem key={inspection.id} value={inspection.id}>
                      {inspection.name}
                      {inspection.inspection_date &&
                        ` (${new Date(inspection.inspection_date).toLocaleDateString()})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Create New Inspection Form */}
        {showCreateInspection && (
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="new-inspection-name">New Inspection Name</Label>
            <div className="flex gap-2">
              <Input
                id="new-inspection-name"
                type="text"
                placeholder="Enter inspection name"
                value={newInspectionName}
                onChange={(e) => setNewInspectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateInspection();
                  }
                }}
                disabled={isCreatingInspection}
              />
              <Button
                onClick={handleCreateInspection}
                disabled={isCreatingInspection || !newInspectionName.trim()}
              >
                {isCreatingInspection ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
