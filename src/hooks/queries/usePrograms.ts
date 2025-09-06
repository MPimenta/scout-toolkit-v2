import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/lib/query-client';

// Types for program filters
export interface ProgramFilters {
  page?: number;
  limit?: number;
  sort?: 'name' | 'date' | 'created_at';
  order?: 'asc' | 'desc';
}

// Types for program response
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

// Fetch programs with filters
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

// Hook for fetching programs with filters
export function usePrograms(filters: ProgramFilters = {}) {
  return useQuery({
    queryKey: queryKeys.programs.list(filters as Record<string, unknown>),
    queryFn: () => fetchPrograms(filters),
    staleTime: 1 * 60 * 1000, // 1 minute for programs list (more dynamic)
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

// Hook for infinite scrolling programs
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

// Hook for prefetching programs
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
