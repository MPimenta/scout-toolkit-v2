'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { ProgramEntry } from '@/drizzle/schema/programs';
import { Activity } from '@/drizzle/schema/activities';
import { Button } from '@/components/ui/button';
import { Plus, Clock, MapPin, Target, Users } from 'lucide-react';
import { AddActivityModal } from './AddActivityModal';
import { AddCustomBlockModal } from './AddCustomBlockModal';
import { ProgramEntryCard } from './ProgramEntryCard';
import { useProgramMutations } from '@/hooks/useProgramMutations';

interface ProgramBuilderProps {
  programId: string;
  initialEntries?: ProgramEntry[];
  onSave?: (entries: ProgramEntry[]) => void;
}

export function ProgramBuilder({ programId, initialEntries = [], onSave }: ProgramBuilderProps) {
  const [entries, setEntries] = useState<ProgramEntry[]>(initialEntries);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const { updateProgram } = useProgramMutations();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setEntries((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newEntries = arrayMove(items, oldIndex, newIndex);
        
        // Update positions
        return newEntries.map((entry, index) => ({
          ...entry,
          position: index,
        }));
      });
    }
  }, []);

  const handleAddActivity = (activity: Activity) => {
    const newEntry: ProgramEntry = {
      id: crypto.randomUUID(),
      program_id: programId,
      position: entries.length,
      start_time: calculateNextStartTime(),
      end_time: calculateEndTime(calculateNextStartTime(), activity.duration_minutes || 30),
      entry_type: 'activity',
      activity_id: activity.id,
      custom_title: null,
      custom_duration_minutes: null,
      created_at: new Date(),
    };

    setEntries([...entries, newEntry]);
    setShowAddActivity(false);
  };

  const handleAddCustomBlock = (title: string, durationMinutes: number) => {
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

    setEntries([...entries, newEntry]);
    setShowAddCustom(false);
  };

  const handleRemoveEntry = (entryId: string) => {
    setEntries(entries.filter(entry => entry.id !== entryId));
  };

  const handleUpdateEntry = (entryId: string, updates: Partial<ProgramEntry>) => {
    setEntries(entries.map(entry => 
      entry.id === entryId ? { ...entry, ...updates } : entry
    ));
  };

  const calculateNextStartTime = (): string => {
    if (entries.length === 0) return '09:00';
    
    const lastEntry = entries[entries.length - 1];
    return lastEntry.end_time;
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    try {
      // Update program entries in database
      await updateProgram(programId, { entries });
      onSave?.(entries);
    } catch (error) {
      console.error('Failed to save program:', error);
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

      {/* Program Entries */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={entries.map(entry => entry.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No entries yet</p>
                <p className="text-sm">Start building your program by adding activities or custom blocks</p>
              </div>
            ) : (
              entries.map((entry, index) => (
                <ProgramEntryCard
                  key={entry.id}
                  entry={entry}
                  index={index}
                  onRemove={handleRemoveEntry}
                  onUpdate={handleUpdateEntry}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

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
  );
}
