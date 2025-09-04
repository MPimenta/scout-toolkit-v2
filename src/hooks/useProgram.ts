import { useState, useEffect, useCallback } from 'react';

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
  };
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
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgram = useCallback(async () => {
    if (!programId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/programs/${programId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não está autenticado');
        }
        if (response.status === 404) {
          throw new Error('Programa não encontrado');
        }
        throw new Error('Erro ao carregar programa');
      }

      const data = await response.json();
      setProgram(data.program);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  const refetch = useCallback(() => {
    fetchProgram();
  }, [fetchProgram]);

  return {
    program,
    loading,
    error,
    refetch
  };
}
