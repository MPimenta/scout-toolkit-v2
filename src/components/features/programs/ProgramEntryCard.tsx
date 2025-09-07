'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProgramEntry } from '../../../../drizzle/schema/programs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Clock, MapPin, Target, Users, GripVertical, Edit, Trash2 } from 'lucide-react';
import { useAllActivities } from '@/hooks/useActivities';

/**
 * Props for the ProgramEntryCard component
 */
interface ProgramEntryCardProps {
  entry: ProgramEntry;
  index: number;
  onRemove: (entryId: string) => void;
  onUpdate: (entryId: string, updates: Partial<ProgramEntry>) => void;
  onEdit?: (entry: ProgramEntry) => void;
}

/**
 * ProgramEntryCard component for displaying individual program entries
 * Provides drag-and-drop functionality and entry management actions
 * @param entry - The program entry to display
 * @param index - The index of the entry in the program
 * @param onRemove - Callback function when entry is removed
 * @param onUpdate - Callback function when entry is updated
 * @returns JSX element representing the program entry card
 */
export function ProgramEntryCard({ entry, index, onRemove, onUpdate, onEdit }: ProgramEntryCardProps) {
  const { activities } = useAllActivities();
  const activity = activities?.find(a => a.id === entry.activity_id);

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
    opacity: isDragging ? 0.5 : 1,
  };

  const getDuration = () => {
    const start = new Date(`2000-01-01T${entry.start_time}`);
    const end = new Date(`2000-01-01T${entry.end_time}`);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
  };

  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    onUpdate(entry.id, { [field]: value });
  };

  const handleRemove = () => {
    onRemove(entry.id);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'shadow-lg' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:bg-muted p-1 rounded"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                #{index + 1}
              </span>
              {entry.entry_type === 'activity' ? (
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Activity</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Custom Block</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(entry)}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-lg">
              {entry.entry_type === 'activity' 
                ? activity?.name || 'Unknown Activity'
                : entry.custom_title || 'Untitled Block'
              }
            </h3>
            {entry.entry_type === 'activity' && activity && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>

          {/* Time and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Start Time
              </label>
              <input
                type="time"
                value={entry.start_time}
                onChange={(e) => handleTimeChange('start_time', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                End Time
              </label>
              <input
                type="time"
                value={entry.end_time}
                onChange={(e) => handleTimeChange('end_time', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              />
            </div>
          </div>

          {/* Duration Display */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Duration: {getDuration()}</span>
          </div>

          {/* Activity Details */}
          {entry.entry_type === 'activity' && activity && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{activity.location || 'No location'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{activity.group_size} group</span>
                </div>
              </div>
              
              {activity.educational_goals && activity.educational_goals.length > 0 && (
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {activity.educational_goals.map(goal => goal.title).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Custom Block Details */}
          {entry.entry_type === 'custom' && (
            <div className="pt-3 border-t">
              <div className="text-sm text-muted-foreground">
                Custom block with {entry.custom_duration_minutes} minutes duration
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
