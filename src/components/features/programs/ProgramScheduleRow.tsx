'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconDisplay } from '@/components/ui/IconDisplay';
import { ProgramEntry } from '../../../../drizzle/schema/programs';
import { ActivitiesResponse } from '@/hooks/useActivities';

interface ProgramScheduleRowProps {
  entry: ProgramEntry;
  activity?: ActivitiesResponse['activities'][0];
  startTime: string;
  endTime: string;
  onEdit: (entry: ProgramEntry) => void;
  onDelete: (entryId: string) => void;
}

export function ProgramScheduleRow({
  entry,
  activity,
  startTime,
  endTime,
  onEdit,
  onDelete,
}: ProgramScheduleRowProps) {
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
    return entry.entry_type === 'activity' ? 'Atividade' : 'Bloco Personalizado';
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-b hover:bg-muted/50 transition-colors',
        isDragging ? 'opacity-50 shadow-lg' : ''
      )}
    >
      {/* Start Time */}
      <td className="px-4 py-3 text-sm font-medium text-muted-foreground">
        {startTime}
      </td>
      
      {/* End Time */}
      <td className="px-4 py-3 text-sm font-medium text-muted-foreground">
        {endTime}
      </td>
      
      {/* Name */}
      <td className="px-4 py-3 text-sm font-medium">
        {getEntryName()}
      </td>
      
      {/* Type */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {getEntryType()}
      </td>
      
      {/* Group Size */}
      <td className="px-4 py-3 text-sm">
        {activity ? (
          <IconDisplay 
            icon="👥" 
            text={activity.group_size} 
            className="text-muted-foreground"
          />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Effort Level */}
      <td className="px-4 py-3 text-sm">
        {activity ? (
          <IconDisplay 
            icon="🟡" 
            text={activity.effort_level} 
            className="text-muted-foreground"
          />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Location */}
      <td className="px-4 py-3 text-sm">
        {activity ? (
          <IconDisplay 
            icon="🌳" 
            text={activity.location} 
            className="text-muted-foreground"
          />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Age Group */}
      <td className="px-4 py-3 text-sm">
        {activity ? (
          <IconDisplay 
            icon="🌍" 
            text={activity.age_group} 
            className="text-muted-foreground"
          />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Duration */}
      <td className="px-4 py-3 text-sm font-medium">
        {getDuration()}
      </td>
      
      {/* Goals */}
      <td className="px-4 py-3 text-sm">
        {activity && activity.educational_goals && activity.educational_goals.length > 0 ? (
          <IconDisplay 
            icon="🎯" 
            text={activity.educational_goals.map(goal => goal.title).join(', ')} 
            className="text-muted-foreground"
          />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* SDGs */}
      <td className="px-4 py-3 text-sm">
        {activity && activity.sdgs && activity.sdgs.length > 0 ? (
          <IconDisplay 
            icon="🌱" 
            text={activity.sdgs.map(sdg => sdg.number).join(', ')} 
            className="text-muted-foreground"
          />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(entry)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
