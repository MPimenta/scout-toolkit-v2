import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query client with optimized defaults for performance
 * - 5 minute stale time for efficient caching
 * - 10 minute garbage collection time
 * - Exponential backoff retry strategy
 * - Smart refetch behavior
 */
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

/**
 * Query key factories for consistent key management across the application
 * Ensures all query keys follow the same pattern and are easily invalidated
 */
export const queryKeys = {
  /** Activity-related query keys */
  activities: {
    /** Base key for all activity queries */
    all: ['activities'] as const,
    /** Base key for activity list queries */
    lists: () => [...queryKeys.activities.all, 'list'] as const,
    /** Key for specific activity list with filters */
    list: (filters: Record<string, unknown> = {}) => [...queryKeys.activities.lists(), filters] as const,
    /** Base key for activity detail queries */
    details: () => [...queryKeys.activities.all, 'detail'] as const,
    /** Key for specific activity detail */
    detail: (id: string) => [...queryKeys.activities.details(), id] as const,
  },
  
  /** Program-related query keys */
  programs: {
    /** Base key for all program queries */
    all: ['programs'] as const,
    /** Base key for program list queries */
    lists: () => [...queryKeys.programs.all, 'list'] as const,
    /** Key for specific program list with filters */
    list: (filters: Record<string, unknown> = {}) => [...queryKeys.programs.lists(), filters] as const,
    /** Base key for program detail queries */
    details: () => [...queryKeys.programs.all, 'detail'] as const,
    /** Key for specific program detail */
    detail: (id: string) => [...queryKeys.programs.details(), id] as const,
    /** Key for program entries */
    entries: (id: string) => [...queryKeys.programs.detail(id), 'entries'] as const,
  },
  
  /** Taxonomy-related query keys */
  taxonomies: {
    /** Base key for all taxonomy queries */
    all: ['taxonomies'] as const,
    /** Key for activity types taxonomy */
    activityTypes: () => [...queryKeys.taxonomies.all, 'activity-types'] as const,
    /** Key for educational goals taxonomy */
    educationalGoals: () => [...queryKeys.taxonomies.all, 'educational-goals'] as const,
    /** Key for SDGs taxonomy */
    sdgs: () => [...queryKeys.taxonomies.all, 'sdgs'] as const,
  },
} as const;
