import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePrograms } from '@/hooks/usePrograms';

// Mock fetch
global.fetch = vi.fn();

const mockPrograms = [
  {
    id: '1',
    name: 'Test Program 1',
    date: '2024-01-15',
    start_time: '09:00',
    is_public: false,
    entry_count: 3,
    total_duration_minutes: 90,
  },
  {
    id: '2',
    name: 'Test Program 2',
    date: '2024-01-20',
    start_time: '14:00',
    is_public: true,
    entry_count: 5,
    total_duration_minutes: 150,
  },
];

describe('usePrograms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches programs successfully', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        programs: mockPrograms,
        pagination: { page: 1, limit: 10, total: 2, total_pages: 1 },
      }),
    });

    const { result } = renderHook(() => usePrograms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.programs).toEqual(mockPrograms);
    expect(result.current.error).toBeNull();
    expect(result.current.pagination).toEqual({ page: 1, limit: 10, total: 2, total_pages: 1 });
  });

  it('handles fetch error', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePrograms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.programs).toEqual([]);
    expect(result.current.error).toBe('Network error');
    expect(result.current.pagination).toBeNull();
  });

  it('handles non-ok response', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Server error' }),
    });

    const { result } = renderHook(() => usePrograms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.programs).toEqual([]);
    expect(result.current.error).toBe('Erro ao carregar programas');
    expect(result.current.pagination).toBeNull();
  });

  it('handles malformed response', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: 'response' }),
    });

    const { result } = renderHook(() => usePrograms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.programs).toEqual([]);
    expect(result.current.error).toBe('Erro ao carregar programas');
    expect(result.current.pagination).toBeNull();
  });

  it('refetches programs when refetch is called', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          programs: mockPrograms,
          pagination: { page: 1, limit: 10, total: 2, total_pages: 1 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          programs: [...mockPrograms, { id: '3', name: 'New Program' }],
          pagination: { page: 1, limit: 10, total: 3, total_pages: 1 },
        }),
      });

    const { result } = renderHook(() => usePrograms());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.programs).toHaveLength(2);

    // Call refetch
    result.current.refetch();

    // Wait for refetch
    await waitFor(() => {
      expect(result.current.programs).toHaveLength(3);
    });
  });

  it('handles pagination parameters', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        programs: mockPrograms,
        pagination: { page: 2, limit: 5, total: 10, total_pages: 2 },
      }),
    });

    const { result } = renderHook(() => usePrograms({ page: 2, limit: 5 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pagination).toEqual({ page: 2, limit: 5, total: 10, total_pages: 2 });
  });

  it('handles sort and order parameters', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        programs: [mockPrograms[0]], // Only first program matches sort
        pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
      }),
    });

    const { result } = renderHook(() => usePrograms({ sort: 'date', order: 'desc' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.programs).toHaveLength(1);
    expect(result.current.programs[0].name).toBe('Test Program 1');
  });

  it('handles empty programs response', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        programs: [],
        pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
      }),
    });

    const { result } = renderHook(() => usePrograms());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.programs).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.pagination?.total).toBe(0);
  });

  it('handles loading state correctly', () => {
    (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => usePrograms());

    expect(result.current.loading).toBe(true);
    expect(result.current.programs).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('constructs correct API URL with parameters', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        programs: mockPrograms,
        pagination: { page: 1, limit: 10, total: 2, total_pages: 1 },
      }),
    });

    renderHook(() => usePrograms({ page: 2, limit: 5, sort: 'date', order: 'desc' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/programs?page=2&limit=5&sort=date&order=desc'
      );
    });
  });

  it('handles fetch timeout gracefully', async () => {
    vi.useFakeTimers();
    
    (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => usePrograms());

    // Fast-forward time
    vi.advanceTimersByTime(10000);

    expect(result.current.loading).toBe(true);

    vi.useRealTimers();
  });
});
