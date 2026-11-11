'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivitiesResponse } from '@/hooks/useActivities';
import { useInfiniteActivities } from '@/hooks/queries/useActivities';
import { Search, Filter, Clock, MapPin, Users, Target } from 'lucide-react';
import { useLocale } from '@/components/locale/LocaleProvider';
import { enumLabel, enumLabelList } from '@/lib/locale/labels';
import { LOCATION_VALUES } from '@/lib/activities/category-values';
import { activityKindLabel } from '@/lib/activities/kind-label';

/**
 * Props for the AddActivityModal component
 */
interface AddActivityModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (activity: ActivitiesResponse['activities'][0]) => void;
  programId: string;
}

interface ValueOption {
  id: string;
  name: string;
  description?: string | null;
}

/** The formats or the focuses of the reference sheet, for the filter selects. */
function useValueOptions(kind: 'activity-formats' | 'activity-focuses', key: 'activity_formats' | 'activity_focuses') {
  return useQuery({
    queryKey: ['taxonomies', kind],
    queryFn: async (): Promise<ValueOption[]> => {
      const response = await fetch(`/api/taxonomies/${kind}`);
      if (!response.ok) return [];
      const body = (await response.json()) as Record<string, ValueOption[]>;
      return body[key] ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * AddActivityModal component for selecting and adding activities to a program.
 * The catalogue is searched and filtered on the server (title, description, materials and
 * instructions; format; focus; location), a page at a time, because it holds more activities
 * than one request can return.
 * @param open - Whether the modal is open
 * @param onClose - Callback function to close the modal
 * @param onAdd - Callback function when an activity is selected
 * @param programId - The ID of the program (currently unused)
 * @returns JSX element representing the activity selection modal
 */
export function AddActivityModal({ open, onClose, onAdd, programId: _programId }: AddActivityModalProps) {
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedFocus, setSelectedFocus] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: formats = [] } = useValueOptions('activity-formats', 'activity_formats');
  const { data: focuses = [] } = useValueOptions('activity-focuses', 'activity_focuses');

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteActivities({
    search: debouncedSearch || undefined,
    format: selectedFormat === 'all' ? undefined : [selectedFormat],
    focus: selectedFocus === 'all' ? undefined : [selectedFocus],
    location: selectedLocation === 'all' ? undefined : [selectedLocation],
    limit: 20,
    sort: 'name',
  });

  const activities = useMemo(() => (data?.pages ?? []).flatMap((page) => page.activities), [data]);
  const total = data?.pages[0]?.pagination.total ?? 0;

  const handleAddActivity = (activity: ActivitiesResponse['activities'][0]) => {
    onAdd(activity);
    onClose();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('programs.addToProgramTitle')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('programs.searchActivities')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-40">
                <Label htmlFor="format-filter">{t('programs.format')}</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger id="format-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('programs.allFormats')}</SelectItem>
                    {formats.map((format) => (
                      <SelectItem key={format.id} value={format.id}>{format.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-40">
                <Label htmlFor="focus-filter">{t('programs.focus')}</Label>
                <Select value={selectedFocus} onValueChange={setSelectedFocus}>
                  <SelectTrigger id="focus-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('programs.allFocuses')}</SelectItem>
                    {focuses.map((focus) => (
                      <SelectItem key={focus.id} value={focus.id}>{focus.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-40">
                <Label htmlFor="location-filter">{t('programs.location')}</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger id="location-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('programs.allLocations')}</SelectItem>
                    {LOCATION_VALUES.map((location) => (
                      <SelectItem key={location} value={location}>{enumLabel(t, 'location', location)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Activities List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('programs.loadingActivities')}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-bold">{t('programs.noActivities')}</p>
                <p className="text-sm">{t('programs.adjustFilters')}</p>
              </div>
            ) : (
              <>
                {activities.map((activity) => {
                  const kind = activityKindLabel(activity, { secondary: true });
                  return (
                    <div
                      key={activity.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleAddActivity(activity)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          {kind && <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{kind}</p>}
                          <h3 className="font-bold text-lg">{activity.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {activity.description}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(activity.approximate_duration_minutes || 30)}</span>
                            </div>

                            {activity.locations.length > 0 && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{enumLabelList(t, 'location', activity.locations)}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{enumLabelList(t, 'groupSize', activity.group_sizes)}</span>
                            </div>
                          </div>

                          {activity.educational_goals && activity.educational_goals.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {activity.educational_goals
                                  .map((goal) =>
                                    typeof goal === 'string' ? goal : goal.title || goal.code
                                  )
                                  .filter(Boolean)
                                  .join(', ')}
                              </span>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddActivity(activity);
                          }}
                        >
                          {t('programs.addToProgram')}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {hasNextPage && (
                  <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                      {t('programs.loadMore', { shown: activities.length, total })}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t('programs.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
