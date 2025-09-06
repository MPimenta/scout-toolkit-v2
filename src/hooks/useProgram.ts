import { useEffect } from 'react';
import { log } from '@/lib/errors';
import { useProgram as useTanStackProgram } from '@/hooks/queries/useProgram';

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

export interface ProgramDetail {
  id: string;
  name: string;
  date: string | null;
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

export function useProgram(programId: string | null) {
  // Use TanStack Query for data fetching
  const { 
    data: program, 
    isLoading: loading, 
    error: queryError, 
    refetch 
  } = useTanStackProgram(programId || '');

  // Transform error to string format for backward compatibility
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Erro desconhecido') : null;

  // Log debug information
  useEffect(() => {
    if (program) {
      log.debug('useProgram hook - Program data loaded', { 
        programId: program.id,
        entryCount: program.entries.length 
      });
    }
  }, [program]);

  return {
    program: program || null,
    loading,
    error,
    refetch: () => refetch()
  };
}
