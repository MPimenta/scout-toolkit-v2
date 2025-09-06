import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized defaults for performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect by default (can be overridden per query)
      refetchOnReconnect: false,
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Query key factories for consistent key management
export const queryKeys = {
  // Activities
  activities: {
    all: ['activities'] as const,
    lists: () => [...queryKeys.activities.all, 'list'] as const,
    list: (filters: Record<string, unknown> = {}) => [...queryKeys.activities.lists(), filters] as const,
    details: () => [...queryKeys.activities.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.activities.details(), id] as const,
  },
  
  // Programs
  programs: {
    all: ['programs'] as const,
    lists: () => [...queryKeys.programs.all, 'list'] as const,
    list: (filters: Record<string, unknown> = {}) => [...queryKeys.programs.lists(), filters] as const,
    details: () => [...queryKeys.programs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.programs.details(), id] as const,
    entries: (id: string) => [...queryKeys.programs.detail(id), 'entries'] as const,
  },
  
  // Taxonomies
  taxonomies: {
    all: ['taxonomies'] as const,
    activityTypes: () => [...queryKeys.taxonomies.all, 'activity-types'] as const,
    educationalGoals: () => [...queryKeys.taxonomies.all, 'educational-goals'] as const,
    sdgs: () => [...queryKeys.taxonomies.all, 'sdgs'] as const,
  },
} as const;
