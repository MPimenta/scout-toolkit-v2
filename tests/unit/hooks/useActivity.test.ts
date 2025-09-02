import { renderHook, waitFor } from '@testing-library/react';
import { useActivity } from '@/hooks/useActivity';
import { vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

const mockFetch = fetch as ReturnType<typeof vi.fn>;

describe('useActivity', () => {
  const mockActivity = {
    id: 'test-activity-id',
    name: { pt: 'Atividade de Teste', en: 'Test Activity' },
    description: { pt: 'Descrição da atividade', en: 'Activity description' },
    materials: { pt: 'Materiais', en: 'Materials' },
    approximate_duration_minutes: 60,
    group_size: 'medium',
    effort_level: 'medium',
    location: 'outside',
    age_group: 'scouts',
    image_url: 'https://example.com/test.jpg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    activity_type: {
      id: 'type-1',
      name: { pt: 'Tipo 1', en: 'Type 1' },
      description: { pt: 'Descrição do tipo', en: 'Type description' },
    },
    educational_goals: [
      {
        id: 'goal-1',
        title: { pt: 'Objetivo 1', en: 'Goal 1' },
        description: { pt: 'Descrição do objetivo', en: 'Goal description' },
        code: 'GOAL_1',
        area: {
          id: 'area-1',
          name: { pt: 'Área 1', en: 'Area 1' },
          description: { pt: 'Descrição da área', en: 'Area description' },
          icon: '🎯',
          code: 'AREA_1',
        },
      },
    ],
    sdgs: [
      {
        id: 'sdg-1',
        number: 1,
        name: { pt: 'Erradicar a Pobreza', en: 'No Poverty' },
        description: { pt: 'Acabar com a pobreza', en: 'End poverty' },
        icon_url: 'https://example.com/sdg-1.png',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial loading state', () => {
    const { result } = renderHook(() => useActivity('test-id'));

    expect(result.current.loading).toBe(true);
    expect(result.current.activity).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('returns error when no activity ID is provided', () => {
    const { result } = renderHook(() => useActivity(''));

    expect(result.current.loading).toBe(false);
    expect(result.current.activity).toBe(null);
    expect(result.current.error).toBe('Activity ID is required');
  });

  it('fetches activity data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivity,
    } as Response);

    const { result } = renderHook(() => useActivity('test-id'));

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for data to be fetched
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activity).toEqual(mockActivity);
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledWith('/api/activities/test-id');
  });

  it('handles 404 error gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const { result } = renderHook(() => useActivity('non-existent-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activity).toBe(null);
    expect(result.current.error).toBe('Atividade não encontrada');
  });

  it('handles generic fetch error gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useActivity('test-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activity).toBe(null);
    expect(result.current.error).toBe('Erro ao carregar atividade');
  });

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useActivity('test-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activity).toBe(null);
    expect(result.current.error).toBe('Erro desconhecido');
  });

  it('handles JSON parsing errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as Response);

    const { result } = renderHook(() => useActivity('test-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activity).toBe(null);
    expect(result.current.error).toBe('Erro desconhecido');
  });

  it('refetches when activity ID changes', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivity,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockActivity, id: 'test-id-2' }),
      } as Response);

    const { result, rerender } = renderHook(
      ({ id }) => useActivity(id),
      { initialProps: { id: 'test-id-1' } }
    );

    // Wait for first fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activity?.id).toBe('test-activity-id');

    // Change ID and rerender
    rerender({ id: 'test-id-2' });

    // Should be loading again
    expect(result.current.loading).toBe(true);

    // Wait for second fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activity?.id).toBe('test-id-2');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('handles empty response gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    } as Response);

    const { result } = renderHook(() => useActivity('test-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activity).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('handles malformed activity data gracefully', async () => {
    const malformedActivity = {
      id: 'test-id',
      // Missing required fields
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => malformedActivity,
    } as Response);

    const { result } = renderHook(() => useActivity('test-id'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should still work even with malformed data
    expect(result.current.activity).toEqual(malformedActivity);
    expect(result.current.error).toBe(null);
  });

  it('cancels previous requests when ID changes quickly', async () => {
    // Mock a slow first request
    mockFetch.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => mockActivity,
      } as Response), 1000))
    );

    // Mock a fast second request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockActivity, id: 'fast-id' }),
    } as Response);

    const { result, rerender } = renderHook(
      ({ id }) => useActivity(id),
      { initialProps: { id: 'slow-id' } }
    );

    // Change ID quickly
    rerender({ id: 'fast-id' });

    // Wait for fast request to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have the fast response, not the slow one
    expect(result.current.activity?.id).toBe('fast-id');
  });
});
