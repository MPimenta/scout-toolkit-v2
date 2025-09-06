import { useState, useEffect } from 'react';
import { log } from '@/lib/errors';
import { useActivities as useTanStackActivities, ActivityFilters as TanStackActivityFilters } from '@/hooks/queries/useActivities';

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

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface FilterInfo {
  applied: Partial<FilterState>;
  available: {
    group_sizes: string[];
    effort_levels: string[];
    locations: string[];
    age_groups: string[];
    activity_types: string[];
  };
}

export interface ActivitiesResponse {
  activities: Array<{
    id: string;
    name: string;
    description: string;
    materials: string;
    approximate_duration_minutes: number;
    group_size: string;
    effort_level: string;
    location: string;
    age_group: string;
    created_at: string;
    activity_type: { id: string; name: string };
    educational_goals: Array<{ id: string; title: string; code: string }>;
    sdgs: Array<{ id: string; number: number; name: string; icon_url: string; icon: string }>;
  }>;
  pagination: PaginationInfo;
  filters: FilterInfo;
}

export interface UseActivitiesOptions {
  filters: FilterState;
  page?: number;
  limit?: number;
  sort?: 'name' | 'duration' | 'created_at';
  order?: 'asc' | 'desc';
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useActivities(options: UseActivitiesOptions) {
  const { filters, page = 1, limit = 20, sort = 'name', order = 'asc' } = options;
  
  // Debounce filters to avoid too many API calls
  const debouncedFilters = useDebounce(filters, 300);

  // Convert to TanStack Query filters format
  const tanStackFilters: TanStackActivityFilters = {
    search: debouncedFilters.search || undefined,
    group_size: debouncedFilters.groupSize.length > 0 ? debouncedFilters.groupSize : undefined,
    effort_level: debouncedFilters.effortLevel.length > 0 ? debouncedFilters.effortLevel : undefined,
    location: debouncedFilters.location || undefined,
    age_group: debouncedFilters.ageGroup.length > 0 ? debouncedFilters.ageGroup : undefined,
    activity_type: debouncedFilters.activityType.length > 0 ? debouncedFilters.activityType : undefined,
    sdgs: debouncedFilters.sdgs.length > 0 ? debouncedFilters.sdgs : undefined,
    educational_goals: debouncedFilters.educationalGoals.length > 0 ? debouncedFilters.educationalGoals : undefined,
    duration_min: debouncedFilters.durationMin || undefined,
    duration_max: debouncedFilters.durationMax || undefined,
    duration_operator: (debouncedFilters.durationOperator as '>=' | '<=' | '=' | '>' | '<') || undefined,
    page,
    limit,
    sort,
    order
  };

  // Use TanStack Query for data fetching
  const { 
    data: response, 
    isLoading: loading, 
    error: queryError, 
    refetch 
  } = useTanStackActivities(tanStackFilters);

  // Transform error to string format for backward compatibility
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Erro desconhecido') : null;

  // Log debug information
  useEffect(() => {
    if (response) {
      log.debug('useActivities hook - Activities data loaded', { 
        activityCount: response.activities.length,
        totalPages: response.pagination.total_pages 
      });
    }
  }, [response]);

  return {
    activities: response?.activities || [],
    loading,
    error,
    pagination: response?.pagination || null,
    filterInfo: response?.filters || null,
    refresh: () => refetch(),
  };
}

// Simple hook for getting all activities without filters
export function useAllActivities() {
  // Use TanStack Query for data fetching with high limit
  const { 
    data: response, 
    isLoading: loading, 
    error: queryError, 
    refetch 
  } = useTanStackActivities({ limit: 1000 });

  // Transform error to string format for backward compatibility
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Erro desconhecido') : null;

  return {
    activities: response?.activities || [],
    loading,
    error,
    refresh: () => refetch(),
  };
}
