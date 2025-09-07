'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProgramEntry } from '../../../../drizzle/schema/programs';
import { ProgramEntry as APIProgramEntry } from '@/hooks/useProgram';
import { ActivitiesResponse } from '@/hooks/useActivities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Calendar, Users, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { AddActivityModal } from './AddActivityModal';
import { AddCustomBlockModal } from './AddCustomBlockModal';
import { ProgramScheduleTable } from './ProgramScheduleTable';
import { ProgramSummary } from './ProgramSummary';
import { ExportButton } from './ExportButton';
import { EditProgramModal } from './EditProgramModal';
import { DeleteProgramModal } from './DeleteProgramModal';
import { useProgramMutations } from '@/hooks/useProgramMutations';
import { useAllActivities } from '@/hooks/useActivities';
import { log } from '@/lib/errors';
import { ErrorBoundary } from '@/lib/errors';
import { validateProps } from '@/lib/validation';
import { specificSchemas } from '@/lib/validation/component-schemas';

/**
 * Props for the ProgramBuilder component
 */
interface ProgramBuilderProps {
  programId: string;
  program: {
    id: string;
    name: string;
    date?: string | null;
    start_time: string;
    is_public: boolean;
    user?: { name?: string; id?: string } | null;
    created_at: string;
    updated_at: string;
  };
  initialEntries?: APIProgramEntry[];
  onSave?: (entries: APIProgramEntry[]) => void;
  onRefresh?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
}

/**
 * ProgramBuilder component for creating and editing program schedules
 * Provides drag-and-drop functionality, activity management, and real-time updates
 * @param programId - The ID of the program being built
 * @param program - The program metadata object
 * @param initialEntries - Initial program entries to display
 * @param onSave - Optional callback when entries are saved
 * @param onRefresh - Optional callback to refresh program data
 * @param onDelete - Optional callback when program is deleted
 * @param canEdit - Whether the user can edit this program
 * @returns JSX element representing the program builder interface
 */
export function ProgramBuilder({ 
  programId, 
  program, 
  initialEntries = [], 
  onSave, 
  onRefresh, 
  onDelete,
  canEdit = true 
}: ProgramBuilderProps) {
  // Validate props in development
  if (process.env.NODE_ENV === 'development') {
    validateProps({ programId, initialEntries, onSave, onRefresh }, specificSchemas.programBuilder, 'ProgramBuilder');
  }
  /**
   * Converts API ProgramEntry to Drizzle ProgramEntry format
   * @param apiEntry - The API program entry to convert
   * @returns Drizzle ProgramEntry object
   */
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
  const [showEditProgram, setShowEditProgram] = useState(false);
  const [showDeleteProgram, setShowDeleteProgram] = useState(false);
  const { updateProgram, deleteProgram } = useProgramMutations();
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
    log.debug('Edit entry requested', { entryId: entry.id, entryType: entry.entry_type });
    
    if (entry.entry_type === 'activity') {
      // For activity entries, we can edit the time or remove the activity
      // For now, we'll show a simple confirmation to remove
      if (confirm('Deseja remover esta atividade do programa?')) {
        handleRemoveEntry(entry.id);
      }
    } else {
      // For custom blocks, we can edit the title and duration
      const newTitle = prompt('Título do bloco:', entry.custom_title || '');
      if (newTitle !== null && newTitle !== entry.custom_title) {
        const updatedEntries = entries.map(e => 
          e.id === entry.id 
            ? { ...e, custom_title: newTitle || undefined, custom_duration_minutes: e.custom_duration_minutes || undefined }
            : { ...e, custom_title: e.custom_title || undefined, custom_duration_minutes: e.custom_duration_minutes || undefined }
        );
        onSave?.(updatedEntries);
      }
    }
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

  /**
   * Formats a date string for display
   * @param dateString - The date string to format (can be null)
   * @returns Formatted date string or "Não especificada"
   */
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Não especificada';
    try {
      return new Date(dateString).toLocaleDateString('pt-PT');
    } catch {
      return 'Data inválida';
    }
  };

  /**
   * Formats a time string for display
   * @param timeString - The time string to format
   * @returns Formatted time string
   */
  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch {
      return timeString;
    }
  };

  /**
   * Handles program deletion
   */
  const handleDelete = async () => {
    try {
      await deleteProgram(programId);
      onDelete?.();
    } catch (error) {
      log.error('Error deleting program', error instanceof Error ? error : new Error(String(error)));
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Program Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{program.name}</h1>
            <p className="text-muted-foreground">
              Criado por {program.user?.name || 'Utilizador desconhecido'}
            </p>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditProgram(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteProgram(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </div>
          )}
        </div>

        {/* Program Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{formatDate(program.date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Hora de Início</p>
                  <p className="font-medium">{formatTime(program.start_time)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Entradas</p>
                  <p className="font-medium">{entries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duração Total</p>
                  <p className="font-medium">{hours}h {minutes}min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Public Status */}
        <div className="flex items-center gap-2">
          {program.is_public ? (
            <>
              <Eye className="h-4 w-4 text-green-600" />
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Programa Público
              </Badge>
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4 text-gray-600" />
              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                Programa Privado
              </Badge>
            </>
          )}
        </div>

        {/* Builder Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Program Builder</h2>
            <p className="text-muted-foreground">
              Drag and drop to reorder, add activities and custom blocks
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ExportButton 
              programId={programId} 
              programName={program.name} 
              variant="outline"
              size="default"
            />
            {canEdit && (
              <Button onClick={handleSave} variant="default">
                Save Program
              </Button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowAddActivity(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Atividade
            </Button>
            <Button 
              onClick={() => setShowAddCustom(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Bloco Personalizado
            </Button>
          </div>
        )}

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

      <EditProgramModal
        isOpen={showEditProgram}
        onClose={() => setShowEditProgram(false)}
        program={program}
        onSuccess={onRefresh}
      />

      <DeleteProgramModal
        isOpen={showDeleteProgram}
        onClose={() => setShowDeleteProgram(false)}
        programName={program.name}
        onConfirm={handleDelete}
      />
      </div>
    </ErrorBoundary>
  );
}
