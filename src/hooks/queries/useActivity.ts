import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/lib/query-client';

/**
 * Interface for individual activity data structure
 */
export interface Activity {
  id: string;
  name: string;
  description: string;
  materials: string;
  approximate_duration_minutes: number;
  group_size: string;
  effort_level: string;
  location: string;
  age_group: string;
  image_url?: string;
  created_at: string;
  activity_type: {
    id: string;
    name: string;
  };
  educational_goals: Array<{
    id: string;
    title: string;
    code: string;
  }>;
  sdgs: Array<{
    id: string;
    number: number;
    name: string;
    icon_url: string;
    icon: string;
  }>;
}

/**
 * Fetches an individual activity by ID from the API
 * @param id - The activity ID to fetch
 * @returns Promise<Activity> - The activity data
 * @throws Error if activity is not found or request fails
 */
async function fetchActivity(id: string): Promise<Activity> {
  const response = await fetch(`/api/activities/${id}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Activity not found');
    }
    throw new Error(`Failed to fetch activity: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Hook for fetching an individual activity by ID using TanStack Query
 * @param id - The activity ID to fetch
 * @returns TanStack Query result with activity data, loading state, and error handling
 */
export function useActivity(id: string) {
  return useQuery({
    queryKey: queryKeys.activities.detail(id),
    queryFn: () => fetchActivity(id),
    enabled: !!id, // Only run query if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes for individual activity
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
}

/**
 * Hook for prefetching an individual activity (useful for navigation and performance optimization)
 * @returns Function to prefetch activity by ID
 */
export function usePrefetchActivity() {
  const queryClient = useQueryClient();
  
  return useCallback((id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.activities.detail(id),
      queryFn: () => fetchActivity(id),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
}
