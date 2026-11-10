'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ObjectivePill } from '../activities/ObjectivePill';
import { useLocale } from '@/components/locale/LocaleProvider';
import { enumLabel, enumLabelList } from '@/lib/locale/labels';
import { ProgramEntry } from '../../../../drizzle/schema/programs';
import { ActivitiesResponse } from '@/hooks/useActivities';
import { useState } from 'react';

/**
 * Props for the ProgramScheduleRow component
 */
interface ProgramScheduleRowProps {
  entry: ProgramEntry;
  activity: ActivitiesResponse['activities'][0] | null;
  startTime: string;
  endTime: string;
  onEdit: (entry: ProgramEntry) => void;
  onDelete: (entryId: string) => void;
}

/**
 * ProgramScheduleRow component for displaying individual program schedule entries
 * Provides drag-and-drop functionality, expandable details, and action buttons
 * @param entry - The program entry to display
 * @param activity - The associated activity data (if entry is an activity)
 * @param startTime - The start time of the entry
 * @param endTime - The end time of the entry
 * @param onEdit - Callback function when entry is edited
 * @param onDelete - Callback function when entry is deleted
 * @returns JSX element representing the program schedule row
 */
export function ProgramScheduleRow({
  entry,
  activity,
  startTime,
  endTime,
  onEdit,
  onDelete,
}: ProgramScheduleRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLocale();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  const getDuration = () => {
    if (entry.entry_type === 'activity' && activity) {
      return formatDuration(activity.approximate_duration_minutes);
    } else if (entry.entry_type === 'custom' && entry.custom_duration_minutes) {
      return formatDuration(entry.custom_duration_minutes);
    }
    return '0m';
  };

  const getEntryName = () => {
    if (entry.entry_type === 'activity' && activity) {
      return activity.name;
    } else if (entry.entry_type === 'custom' && entry.custom_title) {
      return entry.custom_title;
    }
    return 'Sem título';
  };

  const getEntryType = () => {
    return entry.entry_type === 'activity'
      ? 'Atividade'
      : 'Bloco Personalizado';
  };

  return (
    <>
      <tr
        ref={setNodeRef}
        style={style}
        className={cn(
          'border-b transition-colors hover:bg-muted/50',
          isDragging ? 'opacity-50 shadow-lg' : ''
        )}
      >
        {/* Start Time */}
        <td className="px-4 py-3 text-sm font-bold text-muted-foreground">
          {startTime}
        </td>

        {/* End Time */}
        <td className="px-4 py-3 text-sm font-bold text-muted-foreground">
          {endTime}
        </td>

        {/* Name */}
        <td className="px-4 py-3 text-sm font-bold">
          {getEntryName()}
          {entry.entry_type === 'custom' && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {getEntryType()}
            </span>
          )}
        </td>

        {/* Duration */}
        <td className="px-4 py-3 text-sm font-bold">{getDuration()}</td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 cursor-grab p-0 active:cursor-grabbing"
              aria-label="Arrastar para reordenar"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </Button>

            {activity && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                aria-label={
                  isExpanded ? 'Ocultar detalhes' : 'Mostrar detalhes'
                }
                title={isExpanded ? 'Ocultar detalhes' : 'Mostrar detalhes'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}

            {entry.entry_type === 'custom' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Editar bloco"
                title="Editar bloco"
                onClick={() => onEdit(entry)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              aria-label="Eliminar entrada"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
      {isExpanded && activity && (
        <tr className="border-b bg-muted/30">
          <td colSpan={5} className="px-4 py-3">
            <div className="space-y-3 duration-200 animate-in slide-in-from-top-2">
              <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <div className="flex gap-1">
                  <dt className="text-muted-foreground">Formato:</dt>
                  <dd>{activity.format?.name}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="text-muted-foreground">Foco:</dt>
                  <dd>{[activity.focus?.name, activity.secondary_focus?.name].filter(Boolean).join(' · ')}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="text-muted-foreground">Grupo:</dt>
                  <dd>{enumLabelList(t, 'groupSize', activity.group_sizes)}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="text-muted-foreground">Esforço:</dt>
                  <dd>{enumLabel(t, 'effort', activity.effort_level)}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="text-muted-foreground">Local:</dt>
                  <dd>{enumLabelList(t, 'location', activity.locations)}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="text-muted-foreground">Idade:</dt>
                  <dd>{enumLabelList(t, 'ageGroup', activity.age_groups)}</dd>
                </div>
              </dl>
              {activity.educational_goals &&
                activity.educational_goals.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {activity.educational_goals.map((goal) => (
                      <ObjectivePill key={goal.id} objective={goal} activityAgeGroups={activity.age_groups} />
                    ))}
                  </div>
                )}
              {activity.sdgs && activity.sdgs.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {activity.sdgs.map((sdg) => (
                    <div
                      key={sdg.id}
                      className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md border border-border bg-white"
                      title={`ODS ${sdg.number}: ${sdg.name}`}
                    >
                      {sdg.icon_url ? (
                        <img
                          src={sdg.icon_url}
                          alt={`ODS ${sdg.number}`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs font-bold">{sdg.number}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div>
                <h4 className="mb-2 text-sm font-bold">Descrição</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {activity.description || 'Nenhuma descrição disponível.'}
                </p>
              </div>
              {activity.materials && (
                <div>
                  <h4 className="mb-2 text-sm font-bold">
                    Materiais Necessários
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {activity.materials}
                  </p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
