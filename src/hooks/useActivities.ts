import { useState, useEffect, useCallback } from 'react';

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
  
  const [activities, setActivities] = useState<ActivitiesResponse['activities']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [filterInfo, setFilterInfo] = useState<FilterInfo | null>(null);

  // Debounce filters to avoid too many API calls
  const debouncedFilters = useDebounce(filters, 300);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      // Add filter parameters
      if (debouncedFilters.search) params.append('search', debouncedFilters.search);
      if (debouncedFilters.groupSize.length > 0) params.append('group_size', debouncedFilters.groupSize.join(','));
      if (debouncedFilters.effortLevel.length > 0) params.append('effort_level', debouncedFilters.effortLevel.join(','));
      if (debouncedFilters.location) params.append('location', debouncedFilters.location);
      if (debouncedFilters.ageGroup.length > 0) params.append('age_group', debouncedFilters.ageGroup.join(','));
      if (debouncedFilters.activityType.length > 0) params.append('activity_type', debouncedFilters.activityType.join(','));
      if (debouncedFilters.sdgs.length > 0) params.append('sdgs', debouncedFilters.sdgs.join(','));
      if (debouncedFilters.educationalGoals.length > 0) params.append('educational_goals', debouncedFilters.educationalGoals.join(','));
      if (debouncedFilters.durationMin) params.append('duration_min', debouncedFilters.durationMin);
      if (debouncedFilters.durationMax) params.append('duration_max', debouncedFilters.durationMax);
      if (debouncedFilters.durationOperator) params.append('duration_operator', debouncedFilters.durationOperator);
      
      // Add pagination and sorting parameters
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sort', sort);
      params.append('order', order);

      const response = await fetch(`/api/activities?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ActivitiesResponse = await response.json();
      
      setActivities(data.activities);
      setPagination(data.pagination);
      setFilterInfo(data.filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching activities');
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters, page, limit, sort, order]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const refresh = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    pagination,
    filterInfo,
    refresh,
  };
}

// Simple hook for getting all activities without filters
export function useAllActivities() {
  const [activities, setActivities] = useState<ActivitiesResponse['activities']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/activities?limit=1000');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ActivitiesResponse = await response.json();
      setActivities(data.activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching activities');
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllActivities();
  }, [fetchAllActivities]);

  return {
    activities,
    loading,
    error,
    refresh: fetchAllActivities,
  };
}
