'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  X, 
  Clock, 
  ChevronDown,
  ChevronUp,
  Target,
  Globe,
  BookOpen
} from 'lucide-react';
import { log } from '@/lib/errors';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useLocale } from '@/components/locale/LocaleProvider';
import { durationOpLabel, enumLabel } from '@/lib/locale/labels';

/**
 * Interface for activity filter state
 */
export interface FilterState {
  search: string;
  groupSize: string[];
  effortLevel: string[];
  location: string;
  ageGroup: string[];
  activityType: string[];
  sdgs: string[];
  educationalGoals: string[];
  durationMin: string;
  durationMax: string;
  durationOperator: string;
}

/**
 * Props for the ActivityFilters component
 */
interface ActivityFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  availableFilters?: {
    group_sizes: string[];
    effort_levels: string[];
    locations: string[];
    age_groups: string[];
    activity_types: string[];
  };
}

// Real data will be fetched from API

const GROUP_SIZE_VALUES = ['small', 'medium', 'large'] as const;
const EFFORT_VALUES = ['low', 'medium', 'high'] as const;
const LOCATION_VALUES = ['inside', 'outside'] as const;
const AGE_GROUP_VALUES = ['cub_scouts', 'scouts', 'adventurers', 'rovers', 'leaders'] as const;
const DURATION_OPERATOR_VALUES = ['>=', '<=', '='] as const;

/**
 * ActivityFilters component for filtering activities
 * Provides comprehensive filtering options including search, taxonomy filters, and duration filters
 * @param filters - Current filter state
 * @param onFiltersChange - Callback function when filters change
 * @param onClearFilters - Callback function to clear all filters
 * @param availableFilters - Optional available filter options from API
 * @returns JSX element representing the activity filters interface
 */
export function ActivityFilters({ 
  filters, 
  onFiltersChange,
  onClearFilters,
  availableFilters: _availableFilters
}: ActivityFiltersProps) {
  const { t } = useLocale();
  const groupSizeOptions = GROUP_SIZE_VALUES.map((value) => ({
    value,
    label: enumLabel(t, 'groupSize', value),
  }));
  const effortOptions = EFFORT_VALUES.map((value) => ({
    value,
    label: enumLabel(t, 'effort', value),
  }));
  const locationOptions = LOCATION_VALUES.map((value) => ({
    value,
    label: enumLabel(t, 'location', value),
  }));
  const ageGroupOptions = AGE_GROUP_VALUES.map((value) => ({
    value,
    label: enumLabel(t, 'ageGroup', value),
  }));
  const durationOperators = DURATION_OPERATOR_VALUES.map((value) => ({
    value,
    label: durationOpLabel(t, value),
  }));
  const [isExpanded, setIsExpanded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [activityTypeOptions, setActivityTypeOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [sdgOptions, setSdgOptions] = useState<Array<{ id: string; name: string; number: number; icon_url?: string }>>([]);
  const [educationalGoalOptions, setEducationalGoalOptions] = useState<Array<{ id: string; title: string; code: string; area: { name: string } }>>([]);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Fetch filter options from API
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch activity types
        const activityTypesResponse = await fetch('/api/taxonomies/activity-types');
        if (activityTypesResponse.ok) {
          const activityTypesData = await activityTypesResponse.json();
          setActivityTypeOptions(activityTypesData.activity_types || []);
        }

        // Fetch SDGs
        const sdgsResponse = await fetch('/api/taxonomies/sdgs');
        if (sdgsResponse.ok) {
          const sdgsData = await sdgsResponse.json();
          setSdgOptions(sdgsData.sdgs || []);
        }

        // Fetch educational goals
        const goalsResponse = await fetch('/api/taxonomies/educational-goals');
        if (goalsResponse.ok) {
          const goalsData = await goalsResponse.json();
          setEducationalGoalOptions(goalsData.educational_goals || []);
        }
      } catch (error) {
        log.error('Error fetching filter options', error as Error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleFilterChange = (key: keyof FilterState, value: string | string[]) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleMultiSelectChange = (key: keyof FilterState, value: string, checked: boolean) => {
    const currentValues = localFilters[key] as string[];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }
    
    handleFilterChange(key, newValues);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      groupSize: [],
      effortLevel: [],
      location: '',
      ageGroup: [],
      activityType: [],
      sdgs: [],
      educationalGoals: [],
      durationMin: '',
      durationMax: '',
      durationOperator: '>=',
    };
    
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== '' && value !== '>='
  );



  return (
    <>
      {/* Active Filters Display - Always Visible */}
      {hasActiveFilters && (
        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-primary">{t('activities.filtersActiveTitle')}</label>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-primary hover:text-primary/80"
              >
                <X className="w-3 h-3 mr-1" />
                {t('common.clearAll')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  {t('filters.badgeSearch', { value: filters.search })}
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              
              {filters.groupSize.map((size) => (
                <Badge key={size} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  {t('filters.badgeGroup', { value: groupSizeOptions.find(o => o.value === size)?.label ?? size })}
                  <button
                    onClick={() => handleMultiSelectChange('groupSize', size, false)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              
              {filters.effortLevel.map((level) => (
                <Badge key={level} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  {t('filters.badgeEffort', { value: effortOptions.find(o => o.value === level)?.label ?? level })}
                  <button
                    onClick={() => handleMultiSelectChange('effortLevel', level, false)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              
              {filters.location && (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  {t('filters.badgeLocation', { value: locationOptions.find(o => o.value === filters.location)?.label ?? filters.location })}
                  <button
                    onClick={() => handleFilterChange('location', '')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              
              {filters.ageGroup.map((age) => (
                <Badge key={age} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  {t('filters.badgeAge', { value: ageGroupOptions.find(o => o.value === age)?.label ?? age })}
                  <button
                    onClick={() => handleMultiSelectChange('ageGroup', age, false)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}

                             {filters.activityType.map((typeId) => (
                 <Badge key={typeId} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                   {t('filters.badgeType', { value: activityTypeOptions.find(o => o.id === typeId)?.name || '' })}
                   <button
                     onClick={() => handleMultiSelectChange('activityType', typeId, false)}
                     className="ml-1 hover:text-destructive"
                   >
                     <X className="w-3 h-3" />
                   </button>
                 </Badge>
               ))}

               {filters.sdgs.map((sdgId) => (
                 <Badge key={sdgId} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                   {t('activities.sdgTitle', {
                     number: sdgOptions.find(o => o.id === sdgId)?.number ?? '',
                     name: sdgOptions.find(o => o.id === sdgId)?.name || '',
                   })}
                   <button
                     onClick={() => handleMultiSelectChange('sdgs', sdgId, false)}
                     className="ml-1 hover:text-destructive"
                   >
                     <X className="w-3 h-3" />
                   </button>
                 </Badge>
               ))}

               {filters.educationalGoals.map((goalId) => (
                 <Badge key={goalId} variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                   {educationalGoalOptions.find(o => o.id === goalId)?.title || ''}
                   <button
                     onClick={() => handleMultiSelectChange('educationalGoals', goalId, false)}
                     className="ml-1 hover:text-destructive"
                   >
                     <X className="w-3 h-3" />
                   </button>
                 </Badge>
               ))}
              
              {(filters.durationMin || filters.durationMax) && (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  {t('filters.badgeDuration', { min: filters.durationMin || '0', max: filters.durationMax || '∞' })}
                  <button
                    onClick={() => {
                      handleFilterChange('durationMin', '');
                      handleFilterChange('durationMax', '');
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Filters Card */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              {t('activities.filtersTitle')}
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  {t('common.clearFilters')}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="md:hidden min-h-11"
                onClick={() => setSheetOpen(true)}
              >
                <Filter className="w-4 h-4 mr-1" />
                {t('activities.filters')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? t('activities.collapse') : t('activities.expand')}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span className="ml-1">{t('activities.collapse')}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span className="ml-1">{t('activities.expand')}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder={t('activities.searchLong')}
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* All Other Filters (Expanded) */}
          {isExpanded && (
            <div className="hidden md:block space-y-6 pt-4 border-t">
              {/* Basic Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Group Size */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('filters.groupSize')}</label>
                  <div className="space-y-2">
                    {groupSizeOptions.map((option) => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={localFilters.groupSize.includes(option.value)}
                          onChange={(e) => handleMultiSelectChange('groupSize', option.value, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Effort Level */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('filters.effort')}</label>
                  <div className="space-y-2">
                    {effortOptions.map((option) => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={localFilters.effortLevel.includes(option.value)}
                          onChange={(e) => handleMultiSelectChange('effortLevel', option.value, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('filters.location')}</label>
                  <select
                    value={localFilters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">{t('common.all')}</option>
                    {locationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Age Group */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('filters.age')}</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {ageGroupOptions.map((option) => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={localFilters.ageGroup.includes(option.value)}
                          onChange={(e) => handleMultiSelectChange('ageGroup', option.value, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity Type Filter */}
              <div>
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {t('filters.activityType')}
                </label>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                   {activityTypeOptions.map((option) => (
                     <label key={option.id} className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={localFilters.activityType.includes(option.id)}
                         onChange={(e) => handleMultiSelectChange('activityType', option.id, e.target.checked)}
                         className="rounded border-gray-300"
                       />
                       <span className="text-sm">{option.name}</span>
                     </label>
                   ))}
                 </div>
              </div>

              {/* Duration Filters */}
              <div>
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t('filters.duration')}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t('filters.operator')}</label>
                    <select
                      value={localFilters.durationOperator}
                      onChange={(e) => handleFilterChange('durationOperator', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      {durationOperators.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t('filters.minValue')}</label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={localFilters.durationMin}
                      onChange={(e) => handleFilterChange('durationMin', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t('filters.maxValue')}</label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={localFilters.durationMax}
                      onChange={(e) => handleFilterChange('durationMax', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* SDGs Filter */}
              <div>
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t('activities.sdgs')}
                </label>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                   {sdgOptions.map((option) => (
                     <label key={option.id} className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={localFilters.sdgs.includes(option.id)}
                         onChange={(e) => handleMultiSelectChange('sdgs', option.id, e.target.checked)}
                         className="rounded border-gray-300"
                       />
                                               <div className="flex items-center gap-2">
                          {/* SDG Icon - Official UN SDG icon */}
                          {option.icon_url ? (
                            <img
                              src={option.icon_url}
                              alt={t('activities.sdgPrefix', { number: option.number })}
                              className="w-6 h-6 object-contain"
                              title={t('activities.sdgTitle', { number: option.number, name: option.name })}
                            />
                          ) : (
                            // Fallback to colored circle if no icon
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                              style={{
                                backgroundColor: `hsl(${(option.number * 20) % 360}, 70%, 50%)`
                              }}
                              title={t('activities.sdgTitle', { number: option.number, name: option.name })}
                            >
                              {option.number}
                            </div>
                          )}
                          <span className="text-sm">
                            <strong>{t('activities.sdgPrefix', { number: option.number })}:</strong> {option.name}
                          </span>
                        </div>
                     </label>
                   ))}
                 </div>
              </div>

              {/* Educational Goals Filter */}
              <div>
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {t('activities.goals')}
                </label>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                   {educationalGoalOptions.map((option) => (
                     <label key={option.id} className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={localFilters.educationalGoals.includes(option.id)}
                         onChange={(e) => handleMultiSelectChange('educationalGoals', option.id, e.target.checked)}
                         className="rounded border-gray-300"
                       />
                       <span className="text-sm">
                         {option.title}
                         <br />
                         <span className="text-xs text-muted-foreground">
                           {option.area.name}
                         </span>
                       </span>
                     </label>
                   ))}
                 </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('activities.filtersTitle')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('filters.groupSize')}</label>
              {groupSizeOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-2 min-h-11">
                  <input
                    type="checkbox"
                    checked={localFilters.groupSize.includes(option.value)}
                    onChange={(e) => handleMultiSelectChange('groupSize', option.value, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('filters.location')}</label>
              <select
                value={localFilters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm min-h-11"
                aria-label={t('filters.location')}
              >
                <option value="">{t('common.all')}</option>
                {locationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Button className="w-full min-h-11" onClick={() => setSheetOpen(false)}>
              {t('common.apply')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
