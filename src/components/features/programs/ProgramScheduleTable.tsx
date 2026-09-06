'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ProgramScheduleRow } from './ProgramScheduleRow';
import { ProgramEntry } from '../../../../drizzle/schema/programs';
import { ActivitiesResponse } from '@/hooks/useActivities';

/**
 * Props for the ProgramScheduleTable component
 */
interface ProgramScheduleTableProps {
  entries: ProgramEntry[];
  activities: ActivitiesResponse['activities'];
  programStartTime: string;
  onReorder: (entries: ProgramEntry[]) => void;
  onEdit: (entry: ProgramEntry) => void;
  onDelete: (entryId: string) => void;
}

/**
 * ProgramScheduleTable component for displaying and managing program schedule entries
 * Provides drag-and-drop reordering functionality and tabular display
 * @param entries - Array of program entries to display
 * @param activities - Array of available activities for reference
 * @param programStartTime - The start time of the program
 * @param onReorder - Callback function when entries are reordered
 * @param onEdit - Callback function when an entry is edited
 * @param onDelete - Callback function when an entry is deleted
 * @returns JSX element representing the program schedule table
 */
export function ProgramScheduleTable({
  entries,
  activities,
  programStartTime,
  onReorder,
  onEdit,
  onDelete,
}: ProgramScheduleTableProps) {
  const [localEntries, setLocalEntries] = useState(entries);

  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate start and end times for each entry
  const entriesWithTimes = useMemo(() => {
    let currentTime = new Date(`2000-01-01T${programStartTime}:00`);
    
    return localEntries.map((entry) => {
      const startTime = currentTime.toTimeString().slice(0, 5);
      
      // Calculate duration
      let durationMinutes = 0;
      if (entry.entry_type === 'activity') {
        const activity = activities.find(a => a.id === entry.activity_id);
        durationMinutes = activity?.approximate_duration_minutes || 0;
      } else if (entry.entry_type === 'custom' && entry.custom_duration_minutes) {
        durationMinutes = entry.custom_duration_minutes;
      }
      
      // Calculate end time
      const endTime = new Date(currentTime.getTime() + durationMinutes * 60000);
      const endTimeString = endTime.toTimeString().slice(0, 5);
      
      // Update current time for next entry
      currentTime = endTime;
      
      return {
        entry,
        startTime,
        endTime: endTimeString,
        duration: durationMinutes,
      };
    });
  }, [localEntries, activities, programStartTime]);

  const moveEntry = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= localEntries.length) return;
    const newEntries = arrayMove(localEntries, index, nextIndex);
    setLocalEntries(newEntries);
    onReorder(newEntries);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localEntries.findIndex(entry => entry.id === active.id);
      const newIndex = localEntries.findIndex(entry => entry.id === over.id);

      const newEntries = arrayMove(localEntries, oldIndex, newIndex);
      setLocalEntries(newEntries);
      onReorder(newEntries);
    }
  };

  const getActivityById = (activityId: string | null) => {
    if (!activityId) return undefined;
    return activities.find(activity => activity.id === activityId);
  };

  if (localEntries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma entrada no programa ainda.</p>
        <p className="text-sm">Adicione atividades ou blocos personalizados para começar.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="md:hidden divide-y">
        {entriesWithTimes.map(({ entry, startTime, endTime }, index) => (
          <div key={entry.id} className="p-3 space-y-2">
            <p className="font-medium">
              {entry.entry_type === 'custom'
                ? entry.custom_title
                : getActivityById(entry.activity_id)?.name || 'Atividade'}
            </p>
            <p className="text-sm text-muted-foreground">
              {startTime}–{endTime}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-11"
                disabled={index === 0}
                onClick={() => moveEntry(index, -1)}
              >
                Subir
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-11"
                disabled={index === localEntries.length - 1}
                onClick={() => moveEntry(index, 1)}
              >
                Descer
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Início</TableHead>
                <TableHead className="w-20">Fim</TableHead>
                <TableHead className="min-w-48">Nome</TableHead>
                <TableHead className="w-32">Tipo</TableHead>
                <TableHead className="w-24">Grupo</TableHead>
                <TableHead className="w-24">Esforço</TableHead>
                <TableHead className="w-24">Local</TableHead>
                <TableHead className="w-24">Idade</TableHead>
                <TableHead className="w-20">Duração</TableHead>
                <TableHead className="min-w-32">Objetivos</TableHead>
                <TableHead className="w-24">ODS</TableHead>
                <TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={localEntries.map(entry => entry.id)}
                strategy={verticalListSortingStrategy}
              >
                {entriesWithTimes.map(({ entry, startTime, endTime }) => (
                  <ProgramScheduleRow
                    key={entry.id}
                    entry={entry}
                    activity={getActivityById(entry.activity_id) || null}
                    startTime={startTime}
                    endTime={endTime}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </div>
  );
}
