'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ProgramEntry } from '../../../../drizzle/schema/programs';
import { ProgramEntry as APIProgramEntry } from '@/hooks/useProgram';
import { ActivitiesResponse } from '@/hooks/useActivities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Clock,
  Calendar,
  Users,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFeature } from '@/components/providers/FeaturesProvider';
import { AddActivityModal } from './AddActivityModal';
import { AddCustomBlockModal } from './AddCustomBlockModal';
import { ProgramScheduleTable } from './ProgramScheduleTable';
import { ProgramSummary } from './ProgramSummary';
import { ExportButton } from './ExportButton';
import { PDFExportButton } from './PDFExportButton';
import { EditProgramModal } from './EditProgramModal';
import { DeleteProgramModal } from './DeleteProgramModal';
import { CreateOrgoEventDialog } from './CreateOrgoEventDialog';
import { OrgoAttendanceNote } from './OrgoAttendanceNote';
import { useLocale } from '@/components/locale/LocaleProvider';
import { useProgramMutations } from '@/hooks/useProgramMutations';
import { useActivitiesByIds } from '@/hooks/queries/useActivities';
import { log } from '@/lib/errors';
import { ErrorBoundary } from '@/lib/errors';
import { validateProps } from '@/lib/validation';
import { specificSchemas } from '@/lib/validation/component-schemas';
import {
  computeSchedule,
  minutesToTime,
  timeToMinutes,
} from '@/lib/programs/schedule';

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
    orgo_event_uuid?: string | null;
    orgo_event_url?: string | null;
    orgo_event_attendance_url?: string | null;
    orgo_event_pending?: boolean;
    orgo_write_configured?: boolean;
    user?: { name?: string; id?: string } | null;
    created_at: string;
    updated_at: string;
  };
  initialEntries?: APIProgramEntry[];
  onSave?: (entries: APIProgramEntry[]) => void;
  onRefresh?: () => void | Promise<unknown>;
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
  canEdit = true,
}: ProgramBuilderProps) {
  const { t } = useLocale();
  const showPublicStatus = useFeature('public-programs');
  // Validate props in development
  if (process.env.NODE_ENV === 'development') {
    validateProps(
      { programId, initialEntries, onSave, onRefresh },
      specificSchemas.programBuilder,
      'ProgramBuilder'
    );
  }
  /**
   * Converts API ProgramEntry to Drizzle ProgramEntry format
   * @param apiEntry - The API program entry to convert
   * @returns Drizzle ProgramEntry object
   */
  const convertAPIEntryToDrizzle = useCallback(
    (apiEntry: APIProgramEntry): ProgramEntry => ({
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
    }),
    [programId]
  );

  const [entries, setEntries] = useState<ProgramEntry[]>(
    initialEntries.map(convertAPIEntryToDrizzle)
  );
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [showEditProgram, setShowEditProgram] = useState(false);
  const [showDeleteProgram, setShowDeleteProgram] = useState(false);
  const [showOrgoEvent, setShowOrgoEvent] = useState(false);
  const { updateProgram, deleteProgram } = useProgramMutations();
  // The program's own activities, fetched by id (the catalogue list is paged and holds only a
  // few of them), plus the ones added in this session, which are known before the refetch.
  const entryActivityIds = useMemo(
    () => entries.flatMap((entry) => (entry.activity_id ? [entry.activity_id] : [])),
    [entries]
  );
  const { data: programActivities } = useActivitiesByIds(entryActivityIds);
  const [addedActivities, setAddedActivities] = useState<ActivitiesResponse['activities']>([]);
  const addedRef = useRef(new Map<string, ActivitiesResponse['activities'][0]>());
  const activities = useMemo(() => {
    const byId = new Map<string, ActivitiesResponse['activities'][0]>();
    for (const activity of programActivities?.activities ?? []) byId.set(activity.id, activity);
    for (const activity of addedActivities) if (!byId.has(activity.id)) byId.set(activity.id, activity);
    return [...byId.values()];
  }, [programActivities, addedActivities]);

  // One schedule calculation everywhere (src/lib/programs/schedule.ts): entries run back
  // to back from the program's own start time.
  const startTime = minutesToTime(timeToMinutes(program.start_time));
  const durationFor = useCallback(
    (entry: ProgramEntry): number | null =>
      entry.entry_type === 'activity'
        ? (activities.find((a) => a.id === entry.activity_id)
            ?.approximate_duration_minutes ??
          addedRef.current.get(entry.activity_id ?? '')?.approximate_duration_minutes ??
          initialEntries.find((e) => e.activity?.id === entry.activity_id)
            ?.activity?.approximate_duration_minutes ??
          null)
        : null,
    [activities, initialEntries]
  );
  const reschedule = useCallback(
    (list: ProgramEntry[]): ProgramEntry[] =>
      computeSchedule(
        startTime,
        list.map((entry) => ({
          ...entry,
          activity_duration_minutes: durationFor(entry),
        }))
      ).entries.map(
        (
          {
            duration_minutes: _duration,
            activity_duration_minutes: _activity,
            ...entry
          },
          position
        ) => ({
          ...entry,
          position,
        })
      ),
    [startTime, durationFor]
  );

  // Sync local state with initialEntries when they change (after refresh)
  useEffect(() => {
    setEntries(initialEntries.map(convertAPIEntryToDrizzle));
  }, [initialEntries, convertAPIEntryToDrizzle]);

  const handleAddActivity = async (
    activity: ActivitiesResponse['activities'][0]
  ) => {
    addedRef.current.set(activity.id, activity);
    setAddedActivities((previous) => [...previous, activity]);
    const newEntry: ProgramEntry = {
      id: crypto.randomUUID(),
      program_id: programId,
      position: entries.length,
      start_time: startTime,
      end_time: startTime,
      entry_type: 'activity',
      activity_id: activity.id,
      custom_title: null,
      custom_duration_minutes: null,
      created_at: new Date(),
    };

    try {
      // Add to local state immediately for better UX
      const next = reschedule([...entries, newEntry]);
      setEntries(next);
      setShowAddActivity(false);

      // Persist to database (the server recalculates the times too)
      await updateProgram(programId, { entries: next });
      await onRefresh?.();
    } catch (error) {
      log.error(
        'Failed to add activity',
        error instanceof Error ? error : new Error(String(error))
      );
      // Revert local state on error
      setEntries(entries);
      setShowAddActivity(true);
    }
  };

  const handleAddCustomBlock = async (
    title: string,
    durationMinutes: number
  ) => {
    const newEntry: ProgramEntry = {
      id: crypto.randomUUID(),
      program_id: programId,
      position: entries.length,
      start_time: startTime,
      end_time: startTime,
      entry_type: 'custom',
      activity_id: null,
      custom_title: title,
      custom_duration_minutes: durationMinutes,
      created_at: new Date(),
    };

    try {
      // Add to local state immediately for better UX
      const next = reschedule([...entries, newEntry]);
      setEntries(next);
      setShowAddCustom(false);

      // Persist to database (the server recalculates the times too)
      await updateProgram(programId, { entries: next });
      await onRefresh?.();
    } catch (error) {
      log.error(
        'Failed to add custom block',
        error instanceof Error ? error : new Error(String(error))
      );
      // Revert local state on error
      setEntries(entries);
      setShowAddCustom(true);
    }
  };

  const handleRemoveEntry = async (entryId: string) => {
    const updatedEntries = reschedule(
      entries.filter((entry) => entry.id !== entryId)
    );

    try {
      // Update local state immediately for better UX
      setEntries(updatedEntries);

      // Persist to database
      await updateProgram(programId, { entries: updatedEntries });
      await onRefresh?.();
    } catch (error) {
      log.error(
        'Failed to remove entry',
        error instanceof Error ? error : new Error(String(error))
      );
      // Revert local state on error
      setEntries(entries);
    }
  };

  const handleReorderEntries = async (newEntries: ProgramEntry[]) => {
    // New order -> new positions and times
    const updatedEntries = reschedule(newEntries);

    try {
      // Update local state immediately for better UX
      setEntries(updatedEntries);

      // Persist to database
      await updateProgram(programId, { entries: updatedEntries });
      await onRefresh?.();
    } catch (error) {
      log.error(
        'Failed to reorder entries',
        error instanceof Error ? error : new Error(String(error))
      );
      // Revert local state on error
      setEntries(entries);
    }
  };

  const handleUpdateCustomBlock = async (
    entryId: string,
    title: string,
    durationMinutes: number
  ) => {
    const updatedEntries = reschedule(
      entries.map((e) =>
        e.id === entryId
          ? {
              ...e,
              custom_title: title,
              custom_duration_minutes: durationMinutes,
            }
          : e
      )
    );
    try {
      setEntries(updatedEntries);
      await updateProgram(programId, { entries: updatedEntries });
      onSave?.(updatedEntries.map(convertDrizzleEntryToAPI));
      await onRefresh?.();
    } catch (error) {
      log.error(
        'Failed to update custom block',
        error instanceof Error ? error : new Error(String(error))
      );
      setEntries(entries);
    }
  };

  const handleEditEntry = (entry: ProgramEntry) => {
    log.debug('Edit entry requested', {
      entryId: entry.id,
      entryType: entry.entry_type,
    });

    if (entry.entry_type === 'activity') {
      // For activity entries, we can edit the time or remove the activity
      // For now, we'll show a simple confirmation to remove
      if (confirm(t('programs.removeActivityConfirm'))) {
        handleRemoveEntry(entry.id);
      }
    } else {
      // For custom blocks, edit the title and duration; the change is saved right away.
      const newTitle = prompt('Título do bloco:', entry.custom_title || '');
      if (newTitle === null) return;
      const durationInput = prompt(
        'Duração (minutos):',
        String(entry.custom_duration_minutes ?? 15)
      );
      if (durationInput === null) return;
      const newDuration = Number.parseInt(durationInput, 10);
      const title = newTitle.trim() || entry.custom_title || 'Bloco';
      const duration =
        Number.isFinite(newDuration) && newDuration > 0
          ? newDuration
          : (entry.custom_duration_minutes ?? 15);
      if (
        title === entry.custom_title &&
        duration === entry.custom_duration_minutes
      )
        return;
      void handleUpdateCustomBlock(entry.id, title, duration);
    }
  };

  // Convert Drizzle ProgramEntry back to API ProgramEntry
  const convertDrizzleEntryToAPI = (
    drizzleEntry: ProgramEntry
  ): APIProgramEntry => ({
    id: drizzleEntry.id,
    position: drizzleEntry.position,
    start_time: drizzleEntry.start_time,
    end_time: drizzleEntry.end_time,
    entry_type: drizzleEntry.entry_type,
    ...(drizzleEntry.custom_title && {
      custom_title: drizzleEntry.custom_title,
    }),
    ...(drizzleEntry.custom_duration_minutes && {
      custom_duration_minutes: drizzleEntry.custom_duration_minutes,
    }),
    ...(drizzleEntry.activity_id && {
      activity: {
        id: drizzleEntry.activity_id,
        name: '', // Will be populated by the API
        approximate_duration_minutes: 0,
        group_sizes: [],
        effort_level: '',
        locations: [],
      },
    }),
  });

  const totalDuration = computeSchedule(
    startTime,
    entries.map((entry) => ({
      ...entry,
      activity_duration_minutes: durationFor(entry),
    }))
  ).total_minutes;

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
      log.error(
        'Error deleting program',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Program Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{program.name}</h1>
            <p className="text-muted-foreground">
              Criado por {program.user?.name || 'Utilizador desconhecido'}
            </p>
            {canEdit && program.orgo_event_url && !program.orgo_event_pending && (
              <OrgoAttendanceNote programId={program.id} />
            )}
          </div>
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              {program.orgo_event_pending ? (
                <Button disabled>{t('programs.creatingOrgo')}</Button>
              ) : program.orgo_event_url ? (
                <>
                  <Button asChild>
                    <a
                      href={program.orgo_event_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('programs.viewOrgo')}
                    </a>
                  </Button>
                  {program.orgo_event_attendance_url && (
                    <Button asChild variant="outline">
                      <a
                        href={program.orgo_event_attendance_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('programs.orgoAttendance')}
                      </a>
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={() => setShowOrgoEvent(true)}
                  disabled={
                    program.orgo_write_configured === false &&
                    !program.orgo_event_uuid
                  }
                  title={
                    program.orgo_write_configured === false
                      ? 'Integração Orgo não configurada'
                      : undefined
                  }
                >
                  {t('programs.createOrgo')}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="min-h-11 min-w-11"
                    aria-label={t('programs.moreActions')}
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setShowEditProgram(true)}>
                    <Edit className="h-4 w-4" aria-hidden />
                    {t('programs.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setShowDeleteProgram(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    {t('programs.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Program facts: one compact row */}
        <dl className="flex flex-wrap gap-x-8 gap-y-2 rounded-lg border bg-card px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
            <dt className="text-muted-foreground">Data</dt>
            <dd className="font-bold">{formatDate(program.date)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
            <dt className="text-muted-foreground">Início</dt>
            <dd className="font-bold">{formatTime(program.start_time)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
            <dt className="text-muted-foreground">Entradas</dt>
            <dd className="font-bold">{entries.length}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
            <dt className="text-muted-foreground">Duração</dt>
            <dd className="font-bold">
              {hours}h {minutes}min
            </dd>
          </div>
        </dl>

        {/* Public Status (only meaningful while public programs are on) */}
        {showPublicStatus && (
          <div className="flex items-center gap-2">
            {program.is_public ? (
              <>
                <Eye className="h-4 w-4 text-teal-dark" />
                <Badge
                  variant="secondary"
                  className="bg-teal-tint text-teal-dark"
                >
                  Programa Público
                </Badge>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 text-muted-foreground" />
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground"
                >
                  Programa Privado
                </Badge>
              </>
            )}
          </div>
        )}

        {/* Builder Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('programs.builder')}</h2>
            <p className="text-muted-foreground">{t('programs.builderLead')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ExportButton
              programId={programId}
              programName={program.name}
              variant="outline"
              size="default"
            />
            <PDFExportButton
              programId={programId}
              programName={program.name}
              variant="outline"
              size="default"
            />
          </div>
        </div>

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowAddActivity(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('programs.addActivity')}
            </Button>
            <Button
              onClick={() => setShowAddCustom(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('programs.addCustom')}
            </Button>
          </div>
        )}

        {/* Program Summary */}
        <ProgramSummary
          entries={entries}
          activities={activities}
          programStartTime={startTime}
          totalDuration={totalDuration}
        />

        {/* Program Schedule Table */}
        <ProgramScheduleTable
          entries={entries}
          activities={activities}
          programStartTime={startTime}
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

        <CreateOrgoEventDialog
          open={showOrgoEvent}
          onOpenChange={setShowOrgoEvent}
          program={program}
          entries={initialEntries}
          onCreated={onRefresh}
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
