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
  orgo_event_uuid?: string | null;
  orgo_event_url?: string | null;
  orgo_write_configured?: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
  };
  entries: ProgramEntry[];
  summary: ProgramSummary;
}

const emptySummary: ProgramSummary = {
  total_duration_minutes: 0,
  entry_count: 0,
  educational_goals: [],
  sdgs: [],
};

/** Create/list payloads omit entries; the builder always needs a full detail shape. */
export function toProgramDetail(
  program: Partial<Program> & { id: string; date?: string | null }
): Program {
  const entries = program.entries ?? [];
  return {
    id: program.id,
    name: program.name ?? '',
    date: program.date ?? undefined,
    start_time: program.start_time ?? '09:00',
    is_public: Boolean(program.is_public),
    orgo_event_uuid: program.orgo_event_uuid ?? null,
    orgo_event_url: program.orgo_event_url ?? null,
    orgo_write_configured: Boolean(program.orgo_write_configured),
    created_at: program.created_at ?? '',
    updated_at: program.updated_at ?? '',
    user: program.user ?? { id: '', name: '' },
    entries,
    summary: program.summary ?? { ...emptySummary, entry_count: entries.length },
  };
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
  
  const data = await response.json();
  return toProgramDetail(data.program);
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
    select: (data) => toProgramDetail(data),
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
