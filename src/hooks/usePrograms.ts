import { useState, useEffect, useCallback } from 'react';

export interface Program {
  id: string;
  name: string;
  date: string | null;
  start_time: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  entry_count: number;
  total_duration_minutes: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ProgramsResponse {
  programs: Program[];
  pagination: PaginationInfo;
}

export interface UseProgramsOptions {
  page?: number;
  limit?: number;
  sort?: 'name' | 'date' | 'created_at';
  order?: 'asc' | 'desc';
}

export function usePrograms(options: UseProgramsOptions = {}) {
  const { page = 1, limit = 20, sort = 'name', order = 'asc' } = options;
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sort', sort);
      params.append('order', order);

      const response = await fetch(`/api/programs?${params.toString()}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não está autenticado');
        }
        throw new Error('Erro ao carregar programas');
      }

      const data = await response.json();
      
      // Handle malformed responses gracefully
      if (data && Array.isArray(data.programs)) {
        setPrograms(data.programs);
        setPagination(data.pagination || null);
      } else {
        setPrograms([]);
        setPagination(null);
        setError('Erro ao carregar programas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const refetch = useCallback(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  return {
    programs,
    loading,
    error,
    pagination,
    refetch
  };
}

