import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/lib/query-client';

/**
 * Interface for filtering programs in API requests
 */
export interface ProgramFilters {
  page?: number;
  limit?: number;
  sort?: 'name' | 'date' | 'created_at';
  order?: 'asc' | 'desc';
}

/**
 * Interface for program API response structure
 */
export interface ProgramResponse {
  programs: Array<{
    id: string;
    name: string;
    date?: string;
    start_time: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    entry_count: number;
    total_duration_minutes: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Fetches programs from the API with optional filters
 * @param filters - Optional filters to apply to the request
 * @returns Promise<ProgramResponse> - The programs response with pagination info
 */
async function fetchPrograms(filters: ProgramFilters = {}): Promise<ProgramResponse> {
  const searchParams = new URLSearchParams();
  
  // Add filters to search params
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const response = await fetch(`/api/programs?${searchParams.toString()}`);
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please sign in');
    }
    throw new Error(`Failed to fetch programs: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Hook for fetching programs with filters using TanStack Query
 * @param filters - Optional filters to apply to the request
 * @returns TanStack Query result with programs data, loading state, and error handling
 */
export function usePrograms(filters: ProgramFilters = {}) {
  return useQuery({
    queryKey: queryKeys.programs.list(filters as Record<string, unknown>),
    queryFn: () => fetchPrograms(filters),
    staleTime: 1 * 60 * 1000, // 1 minute for programs list (more dynamic)
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

/**
 * Hook for infinite scrolling programs using TanStack Query
 * @param filters - Optional filters to apply (excludes page parameter)
 * @returns TanStack Infinite Query result for paginated programs
 */
export function useInfinitePrograms(filters: Omit<ProgramFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.programs.list({ ...filters, infinite: true } as Record<string, unknown>),
    queryFn: ({ pageParam = 1 }) => fetchPrograms({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination;
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

/**
 * Hook for prefetching programs (useful for navigation and performance optimization)
 * @returns Function to prefetch programs with given filters
 */
export function usePrefetchPrograms() {
  const queryClient = useQueryClient();
  
  return useCallback((filters: ProgramFilters = {}) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.programs.list(filters as Record<string, unknown>),
      queryFn: () => fetchPrograms(filters),
      staleTime: 1 * 60 * 1000,
    });
  }, [queryClient]);
}
