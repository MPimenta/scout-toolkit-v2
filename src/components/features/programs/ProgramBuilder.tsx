'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProgramEntry } from '../../../../drizzle/schema/programs';
import { ProgramEntry as APIProgramEntry } from '@/hooks/useProgram';
import { ActivitiesResponse } from '@/hooks/useActivities';
import { Button } from '@/components/ui/button';
import { Plus, Clock } from 'lucide-react';
import { AddActivityModal } from './AddActivityModal';
import { AddCustomBlockModal } from './AddCustomBlockModal';
import { ProgramScheduleTable } from './ProgramScheduleTable';
import { ProgramSummary } from './ProgramSummary';
import { useProgramMutations } from '@/hooks/useProgramMutations';
import { useAllActivities } from '@/hooks/useActivities';
import { log } from '@/lib/errors';
import { ErrorBoundary } from '@/lib/errors';

interface ProgramBuilderProps {
  programId: string;
  initialEntries?: APIProgramEntry[];
  onSave?: (entries: APIProgramEntry[]) => void;
  onRefresh?: () => void;
}

export function ProgramBuilder({ programId, initialEntries = [], onSave, onRefresh }: ProgramBuilderProps) {
  // Convert API ProgramEntry to Drizzle ProgramEntry
  const convertAPIEntryToDrizzle = useCallback((apiEntry: APIProgramEntry): ProgramEntry => ({
    id: apiEntry.id,
    program_id: programId,
    position: apiEntry.position,
    start_time: apiEntry.start_time,
    end_time: apiEntry.end_time,
    entry_type: apiEntry.entry_type,
    activity_id: apiEntry.activity?.id || null,
    custom_title: apiEntry.custom_title || null,
    custom_duration_minutes: apiEntry.custom_duration_minutes || null,
    created_at: new Date(),
  }), [programId]);

  const [entries, setEntries] = useState<ProgramEntry[]>(
    initialEntries.map(convertAPIEntryToDrizzle)
  );
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const { updateProgram } = useProgramMutations();
  const { activities } = useAllActivities();

  // Sync local state with initialEntries when they change (after refresh)
  useEffect(() => {
    setEntries(initialEntries.map(convertAPIEntryToDrizzle));
  }, [initialEntries, convertAPIEntryToDrizzle]);


  const handleAddActivity = async (activity: ActivitiesResponse['activities'][0]) => {
    const newEntry: ProgramEntry = {
      id: crypto.randomUUID(),
      program_id: programId,
      position: entries.length,
      start_time: calculateNextStartTime(),
      end_time: calculateEndTime(calculateNextStartTime(), activity.approximate_duration_minutes || 30),
      entry_type: 'activity',
      activity_id: activity.id,
      custom_title: null,
      custom_duration_minutes: null,
      created_at: new Date(),
    };

    try {
      // Add to local state immediately for better UX
      setEntries([...entries, newEntry]);
      setShowAddActivity(false);

      // Persist to database
      await updateProgram(programId, { entries: [...entries, newEntry] });
      
      // Refresh parent data to get the latest entries from the database
      onRefresh?.();
    } catch (error) {
      log.error('Failed to add activity', error instanceof Error ? error : new Error(String(error)));
      // Revert local state on error
      setEntries(entries);
      setShowAddActivity(true);
    }
  };

  const handleAddCustomBlock = async (title: string, durationMinutes: number) => {
    const newEntry: ProgramEntry = {
      id: crypto.randomUUID(),
      program_id: programId,
      position: entries.length,
      start_time: calculateNextStartTime(),
      end_time: calculateEndTime(calculateNextStartTime(), durationMinutes),
      entry_type: 'custom',
      activity_id: null,
      custom_title: title,
      custom_duration_minutes: durationMinutes,
      created_at: new Date(),
    };

    try {
      // Add to local state immediately for better UX
      setEntries([...entries, newEntry]);
      setShowAddCustom(false);

      // Persist to database
      await updateProgram(programId, { entries: [...entries, newEntry] });
      
      // Refresh parent data to get the latest entries from the database
      onRefresh?.();
    } catch (error) {
      log.error('Failed to add custom block', error instanceof Error ? error : new Error(String(error)));
      // Revert local state on error
      setEntries(entries);
      setShowAddCustom(true);
    }
  };

  const handleRemoveEntry = async (entryId: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    
    try {
      // Update local state immediately for better UX
      setEntries(updatedEntries);
      
      // Persist to database
      await updateProgram(programId, { entries: updatedEntries });
      
      // Refresh parent data to get the latest entries from the database
      onRefresh?.();
    } catch (error) {
      log.error('Failed to remove entry', error instanceof Error ? error : new Error(String(error)));
      // Revert local state on error
      setEntries(entries);
    }
  };


  const handleReorderEntries = async (newEntries: ProgramEntry[]) => {
    // Update positions based on new order
    const updatedEntries = newEntries.map((entry, index) => ({
      ...entry,
      position: index,
    }));
    
    try {
      // Update local state immediately for better UX
      setEntries(updatedEntries);
      
      // Persist to database
      await updateProgram(programId, { entries: updatedEntries });
      
      // Refresh parent data to get the latest entries from the database
      onRefresh?.();
    } catch (error) {
      log.error('Failed to reorder entries', error instanceof Error ? error : new Error(String(error)));
      // Revert local state on error
      setEntries(entries);
    }
  };

  const handleEditEntry = (entry: ProgramEntry) => {
    // TODO: Implement edit functionality
    log.debug('Edit entry requested', { entryId: entry.id, entryType: entry.entry_type });
  };

  const calculateNextStartTime = (): string => {
    if (entries.length === 0) return '09:00';
    
    const lastEntry = entries[entries.length - 1];
    return lastEntry?.end_time || '09:00';
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = (hours || 0) * 60 + (minutes || 0) + durationMinutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  // Convert Drizzle ProgramEntry back to API ProgramEntry
  const convertDrizzleEntryToAPI = (drizzleEntry: ProgramEntry): APIProgramEntry => ({
    id: drizzleEntry.id,
    position: drizzleEntry.position,
    start_time: drizzleEntry.start_time,
    end_time: drizzleEntry.end_time,
    entry_type: drizzleEntry.entry_type,
    ...(drizzleEntry.custom_title && { custom_title: drizzleEntry.custom_title }),
    ...(drizzleEntry.custom_duration_minutes && { custom_duration_minutes: drizzleEntry.custom_duration_minutes }),
    ...(drizzleEntry.activity_id && {
      activity: {
        id: drizzleEntry.activity_id,
        name: '', // Will be populated by the API
        approximate_duration_minutes: 0,
        group_size: '',
        effort_level: '',
        location: '',
        activity_type: { name: '' }
      }
    }),
  });

  const handleSave = async () => {
    try {
      // Update program entries in database
      await updateProgram(programId, { entries });
      const apiEntries = entries.map(convertDrizzleEntryToAPI);
      onSave?.(apiEntries);
    } catch (error) {
      log.error('Failed to save program', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const totalDuration = entries.reduce((total, entry) => {
    const start = new Date(`2000-01-01T${entry.start_time}`);
    const end = new Date(`2000-01-01T${entry.end_time}`);
    return total + (end.getTime() - start.getTime()) / (1000 * 60);
  }, 0);

  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Program Builder</h2>
          <p className="text-muted-foreground">
            Drag and drop to reorder, add activities and custom blocks
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            <Clock className="inline w-4 h-4 mr-1" />
            Total: {hours}h {minutes}min
          </div>
          <Button onClick={handleSave} variant="default">
            Save Program
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={() => setShowAddActivity(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Activity
        </Button>
        <Button 
          onClick={() => setShowAddCustom(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Custom Block
        </Button>
      </div>

      {/* Program Summary */}
      <ProgramSummary
        entries={entries}
        activities={activities}
        programStartTime="09:00"
        totalDuration={totalDuration}
      />

      {/* Program Schedule Table */}
      <ProgramScheduleTable
        entries={entries}
        activities={activities}
        programStartTime="09:00"
        onReorder={handleReorderEntries}
        onEdit={handleEditEntry}
        onDelete={handleRemoveEntry}
      />

      {/* Modals */}
      <AddActivityModal
        open={showAddActivity}
        onClose={() => setShowAddActivity(false)}
        onAdd={handleAddActivity}
        programId={programId}
      />

      <AddCustomBlockModal
        open={showAddCustom}
        onClose={() => setShowAddCustom(false)}
        onAdd={handleAddCustomBlock}
      />
      </div>
    </ErrorBoundary>
  );
}
