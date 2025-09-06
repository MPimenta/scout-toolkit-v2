import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { Program, ProgramEntry } from '../queries/useProgram';

// Types for program mutations
export interface CreateProgramData {
  name: string;
  date?: string;
  start_time: string;
  is_public?: boolean;
}

export interface UpdateProgramData {
  name: string;
  date?: string;
  start_time: string;
  is_public?: boolean;
}

export interface CreateProgramEntryData {
  position: number;
  start_time: string;
  end_time: string;
  entry_type: 'activity' | 'custom';
  activity_id?: string;
  custom_title?: string;
  custom_duration_minutes?: number;
}

export interface UpdateProgramEntryData {
  position?: number;
  start_time?: string;
  end_time?: string;
  entry_type?: 'activity' | 'custom';
  activity_id?: string;
  custom_title?: string;
  custom_duration_minutes?: number;
}

// API functions
async function createProgram(data: CreateProgramData): Promise<Program> {
  const response = await fetch('/api/programs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create program: ${response.statusText}`);
  }

  return response.json();
}

async function updateProgram(id: string, data: UpdateProgramData): Promise<Program> {
  const response = await fetch(`/api/programs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update program: ${response.statusText}`);
  }

  return response.json();
}

async function deleteProgram(id: string): Promise<void> {
  const response = await fetch(`/api/programs/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete program: ${response.statusText}`);
  }
}

async function createProgramEntry(programId: string, data: CreateProgramEntryData): Promise<ProgramEntry> {
  const response = await fetch(`/api/programs/${programId}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create program entry: ${response.statusText}`);
  }

  return response.json();
}

async function updateProgramEntry(programId: string, entryId: string, data: UpdateProgramEntryData): Promise<ProgramEntry> {
  const response = await fetch(`/api/programs/${programId}/entries/${entryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update program entry: ${response.statusText}`);
  }

  return response.json();
}

async function deleteProgramEntry(programId: string, entryId: string): Promise<void> {
  const response = await fetch(`/api/programs/${programId}/entries/${entryId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete program entry: ${response.statusText}`);
  }
}

// Mutation hooks
export function useCreateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProgram,
    onSuccess: (newProgram) => {
      // Invalidate and refetch programs list
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.lists() });
      
      // Add the new program to the cache
      queryClient.setQueryData(queryKeys.programs.detail(newProgram.id), newProgram);
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgramData }) => 
      updateProgram(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.programs.detail(id) });

      // Snapshot previous value
      const previousProgram = queryClient.getQueryData<Program>(queryKeys.programs.detail(id));

      // Optimistically update
      if (previousProgram) {
        queryClient.setQueryData(queryKeys.programs.detail(id), {
          ...previousProgram,
          ...data,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousProgram };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousProgram) {
        queryClient.setQueryData(queryKeys.programs.detail(id), context.previousProgram);
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.lists() });
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProgram,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.programs.detail(deletedId) });
      
      // Invalidate programs list
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.lists() });
    },
  });
}

export function useCreateProgramEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ programId, data }: { programId: string; data: CreateProgramEntryData }) =>
      createProgramEntry(programId, data),
    onSuccess: (_newEntry, { programId }) => {
      // Invalidate program details to refetch with new entry
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.detail(programId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.entries(programId) });
    },
  });
}

export function useUpdateProgramEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ programId, entryId, data }: { programId: string; entryId: string; data: UpdateProgramEntryData }) =>
      updateProgramEntry(programId, entryId, data),
    onSuccess: (_, { programId }) => {
      // Invalidate program details
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.detail(programId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.entries(programId) });
    },
  });
}

export function useDeleteProgramEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ programId, entryId }: { programId: string; entryId: string }) =>
      deleteProgramEntry(programId, entryId),
    onSuccess: (_, { programId }) => {
      // Invalidate program details
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.detail(programId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.entries(programId) });
    },
  });
}
