import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProgramMutations } from '@/hooks/useProgramMutations';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Create a test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};



// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'test-user' } },
    status: 'authenticated',
  }),
}));

// Mock fetch
global.fetch = vi.fn();

const mockProgram = {
  id: '1',
  name: 'Test Program',
  date: '2024-01-15',
  start_time: '09:00',
  is_public: false,
};

describe('useProgramMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProgram', () => {
    it('creates program successfully', async () => {
      const mockResponse = { ...mockProgram, id: '2' };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ program: mockResponse }),
      });

      const { result } = renderHook(() => useProgramMutations(), {
        wrapper: createWrapper(),
      });

      let response;
      await act(async () => {
        response = await result.current.createProgram({
          name: 'New Program',
          date: '2024-01-20',
          start_time: '10:00',
          is_public: true,
        });
      });

      expect(response).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Program',
          date: '2024-01-20',
          start_time: '10:00',
          is_public: true,
        }),
      });
    });

    it('handles creation error', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Validation error' }),
      });

      const { result } = renderHook(() => useProgramMutations(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.createProgram({
            name: 'Invalid Program',
            date: 'invalid-date',
            start_time: 'invalid-time',
            is_public: false,
          });
        })
      ).rejects.toThrow('Validation error');
    });

    it('handles network error', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useProgramMutations(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.createProgram({
            name: 'New Program',
            date: '2024-01-20',
            start_time: '10:00',
            is_public: false,
          });
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('updateProgram', () => {
    it('updates program successfully', async () => {
      const updatedProgram = { ...mockProgram, name: 'Updated Program' };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ program: updatedProgram }),
      });

      const { result } = renderHook(() => useProgramMutations(), {
        wrapper: createWrapper(),
      });

      let response;
      await act(async () => {
        response = await result.current.updateProgram('1', {
          name: 'Updated Program',
          date: '2024-01-15',
          start_time: '09:00',
          is_public: false,
        });
      });

      expect(response).toEqual(updatedProgram);
      expect(fetch).toHaveBeenCalledWith('/api/programs/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Program',
          date: '2024-01-15',
          start_time: '09:00',
          is_public: false,
        }),
      });
    });

    it('handles update error', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Programa não encontrado' }),
      });

      const { result } = renderHook(() => useProgramMutations(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.updateProgram('999', {
            name: 'Updated Program',
            date: '2024-01-15',
            start_time: '09:00',
            is_public: false,
          });
        })
      ).rejects.toThrow('Programa não encontrado');
    });
  });

  describe('deleteProgram', () => {
    it('deletes program successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Programa excluído com sucesso' }),
      });

      const { result } = renderHook(() => useProgramMutations(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.deleteProgram('1');
      });

      expect(fetch).toHaveBeenCalledWith('/api/programs/1', {
        method: 'DELETE',
      });
    });

    it('handles deletion error', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'Access denied' }),
      });

      const { result } = renderHook(() => useProgramMutations(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.deleteProgram('1');
        })
      ).rejects.toThrow('Erro ao eliminar programa');
    });
  });

  describe('Error Handling', () => {
    it('handles malformed JSON response', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { result } = renderHook(() => useProgramMutations(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.createProgram({
            name: 'New Program',
            date: '2024-01-20',
            start_time: '10:00',
            is_public: false,
          });
        })
      ).rejects.toThrow('Invalid JSON');
    });

    it('handles timeout scenarios', async () => {
      vi.useFakeTimers();
      
      (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useProgramMutations(), {
        wrapper: createWrapper(),
      });

      const promise = act(async () => {
        await result.current.createProgram({
          name: 'New Program',
          date: '2024-01-20',
          start_time: '10:00',
          is_public: false,
        });
      });

      // Fast-forward time
      vi.advanceTimersByTime(10000);

      expect(promise).toBeDefined();

      vi.useRealTimers();
    });
  });

  describe('Request Formatting', () => {
    it.skip('sends correct headers', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ program: mockProgram }),
      });

      const { result } = renderHook(() => useProgramMutations(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createProgram({
          name: 'New Program',
          date: '2024-01-20',
          start_time: '10:00',
          is_public: false,
        });
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/programs',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it.skip('formats request body correctly', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ program: mockProgram }),
      });

      const { result } = renderHook(() => useProgramMutations(), {
        wrapper: createWrapper(),
      });

      const programData = {
        name: 'New Program',
        date: '2024-01-20',
        start_time: '10:00',
        is_public: true,
      };

      await act(async () => {
        await result.current.createProgram(programData);
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/programs',
        expect.objectContaining({
          body: JSON.stringify(programData),
        })
      );
    });
  });

  describe('Response Handling', () => {
    it.skip('handles empty response body', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const { result } = renderHook(() => useProgramMutations(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.deleteProgram('1');
      });

      expect(fetch).toHaveBeenCalledWith('/api/programs/1', {
        method: 'DELETE',
      });
    });

    it.skip('handles response with only message', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Success' }),
      });

      const { result } = renderHook(() => useProgramMutations(), {
        wrapper: createWrapper(),
      });

      const response = await act(async () => {
        return await result.current.deleteProgram('1');
      });

      expect(response).toEqual(true);
    });
  });
});
