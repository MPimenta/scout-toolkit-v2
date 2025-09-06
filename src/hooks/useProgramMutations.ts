import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProgramEntry } from '../../drizzle/schema/programs';

export interface CreateProgramData {
  name: string;
  date: string;
  start_time: string;
  is_public?: boolean;
}

export interface UpdateProgramData {
  name?: string;
  date?: string;
  start_time?: string;
  is_public?: boolean;
  entries?: ProgramEntry[]; // Program entries for the builder
}

export function useProgramMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createProgram = useCallback(async (data: CreateProgramData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não está autenticado');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Dados inválidos');
        }
        throw new Error('Erro ao criar programa');
      }

      const result = await response.json();
      return result.program;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProgram = useCallback(async (programId: string, data: UpdateProgramData) => {
    setLoading(true);
    setError(null);

    try {
      // If entries are provided, update them separately
      if (data.entries) {
        const entriesResponse = await fetch(`/api/programs/${programId}/entries`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ entries: data.entries }),
        });

        if (!entriesResponse.ok) {
          if (entriesResponse.status === 401) {
            throw new Error('Não está autenticado');
          }
          if (entriesResponse.status === 404) {
            throw new Error('Programa não encontrado');
          }
          if (entriesResponse.status === 400) {
            const errorData = await entriesResponse.json();
            throw new Error(errorData.error || 'Dados inválidos');
          }
          throw new Error('Erro ao atualizar entradas do programa');
        }
      }

      // Update program metadata if provided
      const { entries: _entries, ...programData } = data;
      if (Object.keys(programData).length > 0) {
        const response = await fetch(`/api/programs/${programId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(programData),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Não está autenticado');
          }
          if (response.status === 404) {
            throw new Error('Programa não encontrado');
          }
          if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Dados inválidos');
          }
          throw new Error('Erro ao atualizar programa');
        }

        const result = await response.json();
        return result.program;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProgram = useCallback(async (programId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/programs/${programId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não está autenticado');
        }
        if (response.status === 404) {
          throw new Error('Programa não encontrado');
        }
        throw new Error('Erro ao eliminar programa');
      }

      // Redirect to programs list after successful deletion
      router.push('/programs');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createProgram,
    updateProgram,
    deleteProgram,
    loading,
    error,
    clearError,
  };
}

