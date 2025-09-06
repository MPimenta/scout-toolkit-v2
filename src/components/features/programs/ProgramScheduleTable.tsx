'use client';

import { useState, useMemo } from 'react';
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
import { ProgramScheduleRow } from './ProgramScheduleRow';
import { ProgramEntry } from '../../../../drizzle/schema/programs';
import { ActivitiesResponse } from '@/hooks/useActivities';

interface ProgramScheduleTableProps {
  entries: ProgramEntry[];
  activities: ActivitiesResponse['activities'];
  programStartTime: string;
  onReorder: (entries: ProgramEntry[]) => void;
  onEdit: (entry: ProgramEntry) => void;
  onDelete: (entryId: string) => void;
}

export function ProgramScheduleTable({
  entries,
  activities,
  programStartTime,
  onReorder,
  onEdit,
  onDelete,
}: ProgramScheduleTableProps) {
  const [localEntries, setLocalEntries] = useState(entries);

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
      <div className="overflow-x-auto">
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
