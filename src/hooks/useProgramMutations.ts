import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProgramEntry } from '../../drizzle/schema/programs';
import { 
  useCreateProgram, 
  useUpdateProgram, 
  useDeleteProgram,
  useCreateProgramEntry,
  useUpdateProgramEntry,
  useDeleteProgramEntry,
  CreateProgramEntryData,
  UpdateProgramEntryData
} from '@/hooks/mutations/useProgramMutations';

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
  const router = useRouter();
  
  // Use TanStack Query mutations
  const createProgramMutation = useCreateProgram();
  const updateProgramMutation = useUpdateProgram();
  const deleteProgramMutation = useDeleteProgram();
  const createProgramEntryMutation = useCreateProgramEntry();
  const updateProgramEntryMutation = useUpdateProgramEntry();
  const deleteProgramEntryMutation = useDeleteProgramEntry();

  const createProgram = useCallback(async (data: CreateProgramData) => {
    try {
      const result = await createProgramMutation.mutateAsync(data);
      router.push(`/programs/${result.id}`);
      return result;
    } catch (err) {
      throw err;
    }
  }, [createProgramMutation, router]);

  const updateProgram = useCallback(async (programId: string, data: UpdateProgramData) => {
    try {
      // If entries are provided, update them separately via the entries API
      if (data.entries) {
        const response = await fetch(`/api/programs/${programId}/entries`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: data.entries }),
        });

        if (!response.ok) {
          throw new Error('Failed to update program entries');
        }
      }

      // Update program metadata if provided
      const { entries: _entries, ...programData } = data;
      if (Object.keys(programData).length > 0) {
        const result = await updateProgramMutation.mutateAsync({ 
          id: programId, 
          data: programData 
        });
        return result;
      }

      return true;
    } catch (err) {
      throw err;
    }
  }, [updateProgramMutation]);

  const deleteProgram = useCallback(async (programId: string) => {
    try {
      await deleteProgramMutation.mutateAsync(programId);
      router.push('/programs');
      return true;
    } catch (err) {
      throw err;
    }
  }, [deleteProgramMutation, router]);

  const createProgramEntry = useCallback(async (programId: string, entryData: CreateProgramEntryData) => {
    try {
      const result = await createProgramEntryMutation.mutateAsync({ programId, data: entryData });
      return result;
    } catch (err) {
      throw err;
    }
  }, [createProgramEntryMutation]);

  const updateProgramEntry = useCallback(async (programId: string, entryId: string, entryData: UpdateProgramEntryData) => {
    try {
      const result = await updateProgramEntryMutation.mutateAsync({ programId, entryId, data: entryData });
      return result;
    } catch (err) {
      throw err;
    }
  }, [updateProgramEntryMutation]);

  const deleteProgramEntry = useCallback(async (programId: string, entryId: string) => {
    try {
      await deleteProgramEntryMutation.mutateAsync({ programId, entryId });
    } catch (err) {
      throw err;
    }
  }, [deleteProgramEntryMutation]);

  // Get loading state from any active mutation
  const loading = createProgramMutation.isPending || 
                  updateProgramMutation.isPending || 
                  deleteProgramMutation.isPending ||
                  createProgramEntryMutation.isPending ||
                  updateProgramEntryMutation.isPending ||
                  deleteProgramEntryMutation.isPending;

  // Get error from any mutation
  const error = createProgramMutation.error || 
                updateProgramMutation.error || 
                deleteProgramMutation.error ||
                createProgramEntryMutation.error ||
                updateProgramEntryMutation.error ||
                deleteProgramEntryMutation.error;

  const clearError = useCallback(() => {
    // Clear errors from all mutations
    createProgramMutation.reset();
    updateProgramMutation.reset();
    deleteProgramMutation.reset();
    createProgramEntryMutation.reset();
    updateProgramEntryMutation.reset();
    deleteProgramEntryMutation.reset();
  }, [createProgramMutation, updateProgramMutation, deleteProgramMutation, createProgramEntryMutation, updateProgramEntryMutation, deleteProgramEntryMutation]);

  return {
    createProgram,
    updateProgram,
    deleteProgram,
    createProgramEntry,
    updateProgramEntry,
    deleteProgramEntry,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Unknown error') : null,
    clearError,
  };
}

