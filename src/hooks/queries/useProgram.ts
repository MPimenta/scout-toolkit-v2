import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/lib/query-client';

/**
 * Interface for program entry data structure
 */
export interface ProgramEntry {
  id: string;
  position: number;
  start_time: string;
  end_time: string;
  entry_type: 'activity' | 'custom';
  custom_title?: string;
  custom_duration_minutes?: number;
  activity?: {
    id: string;
    name: string;
    approximate_duration_minutes: number;
    group_size: string;
    effort_level: string;
    location: string;
    activity_type: {
      name: string;
    };
  } | null;
}

/**
 * Interface for program summary data structure
 */
export interface ProgramSummary {
  total_duration_minutes: number;
  entry_count: number;
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
  }>;
}

// Type for individual program
export interface Program {
  id: string;
  name: string;
  date?: string;
  start_time: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
  };
  entries: ProgramEntry[];
  summary: ProgramSummary;
}

/**
 * Fetches an individual program by ID from the API
 * @param id - The program ID to fetch
 * @returns Promise<Program> - The program data with entries and summary
 * @throws Error if program is not found, unauthorized, or request fails
 */
async function fetchProgram(id: string): Promise<Program> {
  const response = await fetch(`/api/programs/${id}`);
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - please sign in');
    }
    if (response.status === 404) {
      throw new Error('Program not found');
    }
    throw new Error(`Failed to fetch program: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Hook for fetching an individual program by ID using TanStack Query
 * @param id - The program ID to fetch
 * @returns TanStack Query result with program data, loading state, and error handling
 */
export function useProgram(id: string) {
  return useQuery({
    queryKey: queryKeys.programs.detail(id),
    queryFn: () => fetchProgram(id),
    enabled: !!id, // Only run query if id is provided
    staleTime: 30 * 1000, // 30 seconds for individual program (very dynamic)
    gcTime: 2 * 60 * 1000, // 2 minutes cache
  });
}

/**
 * Hook for prefetching an individual program (useful for navigation and performance optimization)
 * @returns Function to prefetch program by ID
 */
export function usePrefetchProgram() {
  const queryClient = useQueryClient();
  
  return useCallback((id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.programs.detail(id),
      queryFn: () => fetchProgram(id),
      staleTime: 30 * 1000,
    });
  }, [queryClient]);
}
