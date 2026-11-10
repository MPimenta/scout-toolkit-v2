'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { log } from '@/lib/errors';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useLocale } from '@/components/locale/LocaleProvider';
import { EMPTY_FILTERS, hasActiveFilters, type FilterState } from '@/lib/activities/filters';
import type { GoalOption } from '@/lib/activities/objective-tree';
import { ActiveFilterChips } from './filters/ActiveFilterChips';
import { FilterPanel, type SdgOption, type ValueOption } from './filters/FilterPanel';

export type { FilterState } from '@/lib/activities/filters';

interface ActivityFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  /** Number of activities matching the current filters (shown on the phone sheet button). */
  resultCount?: number;
  availableFilters?: {
    group_sizes: string[];
    effort_levels: string[];
    locations: string[];
    age_groups: string[];
  };
}

/**
 * Catalogue filters: search, active chips, and the filter panel (inline on desktop, a bottom
 * sheet with the same panel on phones).
 */
export function ActivityFilters({ filters, onFiltersChange, onClearFilters, resultCount }: ActivityFiltersProps) {
  const { t } = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [formats, setFormats] = useState<ValueOption[]>([]);
  const [focuses, setFocuses] = useState<ValueOption[]>([]);
  const [sdgs, setSdgs] = useState<SdgOption[]>([]);
  const [goals, setGoals] = useState<GoalOption[]>([]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    const load = async () => {
      try {
        const [formatsRes, focusesRes, sdgsRes, goalsRes] = await Promise.all([
          fetch('/api/taxonomies/activity-formats'),
          fetch('/api/taxonomies/activity-focuses'),
          fetch('/api/taxonomies/sdgs'),
          fetch('/api/taxonomies/educational-goals'),
        ]);
        if (formatsRes.ok) setFormats(((await formatsRes.json()).activity_formats as ValueOption[]) || []);
        if (focusesRes.ok) setFocuses(((await focusesRes.json()).activity_focuses as ValueOption[]) || []);
        if (sdgsRes.ok) setSdgs(((await sdgsRes.json()).sdgs as SdgOption[]) || []);
        if (goalsRes.ok) setGoals(((await goalsRes.json()).educational_goals as GoalOption[]) || []);
      } catch (error) {
        log.error('Error fetching filter options', error as Error);
      }
    };
    load();
  }, []);

  const change = (next: FilterState) => {
    setLocalFilters(next);
    onFiltersChange(next);
  };

  const clear = () => {
    setLocalFilters(EMPTY_FILTERS);
    onClearFilters();
  };

  const chipOptions = useMemo(() => {
    const areas = new Map<string, string>();
    const generals = new Map<string, string>();
    for (const goal of goals) {
      if (goal.area) areas.set(goal.area.id, goal.area.name);
      if (goal.general_objective) generals.set(goal.general_objective.id, goal.general_objective.code);
    }
    return {
      formats,
      focuses,
      sdgs,
      goals,
      areas: [...areas].map(([id, name]) => ({ id, name })),
      generals: [...generals].map(([id, code]) => ({ id, code })),
    };
  }, [formats, focuses, sdgs, goals]);

  const active = hasActiveFilters(filters);

  return (
    <>
      {active && <ActiveFilterChips filters={filters} options={chipOptions} onChange={change} onClear={clear} />}

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="search"
                placeholder={t('activities.searchLong')}
                aria-label={t('activities.search')}
                value={localFilters.search}
                onChange={(e) => change({ ...localFilters, search: e.target.value })}
                className="min-h-11 pl-10"
              />
            </div>
            <Button variant="outline" className="min-h-11 shrink-0 md:hidden" onClick={() => setSheetOpen(true)}>
              <Filter className="mr-1 h-4 w-4" aria-hidden />
              {t('activities.filters')}
            </Button>
            <Button
              variant="ghost"
              className="hidden shrink-0 md:inline-flex"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
              <span className="ml-1">{isExpanded ? t('activities.collapse') : t('activities.expand')}</span>
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="hidden border-t md:block">
            <FilterPanel filters={localFilters} onChange={change} formats={formats} focuses={focuses} sdgs={sdgs} goals={goals} />
          </CardContent>
        )}
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[92vh] gap-0 overflow-y-auto p-0">
          <SheetHeader className="sticky top-0 z-10 space-y-3 bg-background px-6 pb-3 pt-6">
            <SheetTitle>{t('filters.panelTitle')}</SheetTitle>
            <Input
              type="search"
              placeholder={t('activities.searchLong')}
              aria-label={t('activities.search')}
              value={localFilters.search}
              onChange={(e) => change({ ...localFilters, search: e.target.value })}
              className="min-h-11"
            />
          </SheetHeader>
          <div className="px-6 pt-4">
            <FilterPanel filters={localFilters} onChange={change} formats={formats} focuses={focuses} sdgs={sdgs} goals={goals} compact />
          </div>
          <div className="sticky bottom-0 mt-4 flex gap-2 border-t bg-background px-6 pb-[calc(0.75rem+var(--safe-bottom))] pt-3">
            {active && (
              <Button variant="outline" className="min-h-11" onClick={clear}>
                {t('common.clearAll')}
              </Button>
            )}
            <Button className="min-h-11 flex-1" onClick={() => setSheetOpen(false)}>
              {resultCount !== undefined ? t('filters.seeResults', { count: resultCount }) : t('common.apply')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
