import { useQuery, useInfiniteQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/lib/query-client';

/**
 * Interface for filtering activities in API requests
 */
export interface ActivityFilters {
  search?: string;
  group_size?: string[];
  effort_level?: string[];
  location?: string[];
  age_group?: string[];
  format?: string[];
  focus?: string[];
  /** Exactly these activities (at most 100), whatever page and limit say. */
  ids?: string[];
  sdgs?: string[];
  educational_goals?: string[];
  educational_areas?: string[];
  general_objectives?: string[];
  duration_min?: string;
  duration_max?: string;
  page?: number;
  limit?: number;
  sort?: 'name' | 'duration' | 'created_at';
  order?: 'asc' | 'desc';
}

/**
 * Interface for activity API response structure
 */
export interface ActivityResponse {
  activities: Array<{
    id: string;
    name: string;
    description: string;
    materials: string;
    approximate_duration_minutes: number;
    group_sizes: string[];
    effort_level: string;
    locations: string[];
    age_groups: string[];
    image_url?: string;
    created_at: string;
    instructions?: string | null;
    duration_min_minutes?: number | null;
    duration_max_minutes?: number | null;
    format?: { id: string; code: string; name: string } | null;
    focus?: { id: string; code: string; name: string } | null;
    secondary_focus?: { id: string; code: string; name: string } | null;
    educational_goals: Array<{
      id: string;
      title: string;
      code: string;
      age_groups?: string[];
    }>;
    sdgs: Array<{
      id: string;
      number: number;
      name: string;
      icon_url: string;
      icon: string;
    }>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  filters: {
    applied: Partial<ActivityFilters>;
    available: {
      group_sizes: string[];
      effort_levels: string[];
      locations: string[];
      age_groups: string[];
    };
  };
}

/**
 * Fetches activities from the API with optional filters
 * @param filters - Optional filters to apply to the request
 * @returns Promise<ActivityResponse> - The activities response with pagination and filter info
 */
async function fetchActivities(filters: ActivityFilters = {}): Promise<ActivityResponse> {
  const searchParams = new URLSearchParams();
  
  // Add filters to search params
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(','));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });

  const response = await fetch(`/api/activities?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch activities: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Hook for fetching activities with filters using TanStack Query
 * @param filters - Optional filters to apply to the request
 * @returns TanStack Query result with activities data, loading state, and error handling
 */
export function useActivities(filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: queryKeys.activities.list(filters as Record<string, unknown>),
    queryFn: () => fetchActivities(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes for activities list
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

/**
 * The activities with these ids (at most 100), complete with goals, SDGs, format and focus.
 * A program page uses it to show its own activities, whichever page of the catalogue they are on.
 */
export function useActivitiesByIds(ids: readonly string[]) {
  const unique = [...new Set(ids)].sort().slice(0, 100);
  return useQuery({
    queryKey: queryKeys.activities.list({ ids: unique }),
    queryFn: () => fetchActivities({ ids: unique, limit: 100 }),
    enabled: unique.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook for infinite scrolling activities using TanStack Query
 * @param filters - Optional filters to apply (excludes page parameter)
 * @returns TanStack Infinite Query result for paginated activities
 */
export function useInfiniteActivities(filters: Omit<ActivityFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.activities.list({ ...filters, infinite: true } as Record<string, unknown>),
    queryFn: ({ pageParam = 1 }) => fetchActivities({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination;
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

/**
 * Hook for prefetching activities (useful for navigation and performance optimization)
 * @returns Function to prefetch activities with given filters
 */
export function usePrefetchActivities() {
  const queryClient = useQueryClient();
  
  return useCallback((filters: ActivityFilters = {}) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.activities.list(filters as Record<string, unknown>),
      queryFn: () => fetchActivities(filters),
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient]);
}
