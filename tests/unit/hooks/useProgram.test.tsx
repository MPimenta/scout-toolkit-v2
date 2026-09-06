import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProgram } from '@/hooks/useProgram';
import { toProgramDetail } from '@/hooks/queries/useProgram';
import { queryKeys } from '@/lib/query-client';

vi.mock('@/lib/errors', () => ({
  log: { debug: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

function wrapperWithCache(programId: string, cached: object) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(queryKeys.programs.detail(programId), cached);

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('toProgramDetail', () => {
  it('fills missing entries and summary so the builder can render', () => {
    const program = toProgramDetail({
      id: 'prog-1',
      name: 'Acampamento',
      start_time: '09:00',
      is_public: false,
    });

    expect(program.entries).toEqual([]);
    expect(program.summary.entry_count).toBe(0);
    expect(program.user).toEqual({ id: '', name: '' });
  });
});

describe('useProgram', () => {
  it('does not throw when the cache has a create payload without entries', () => {
    const Wrapper = wrapperWithCache('prog-1', {
      id: 'prog-1',
      name: 'Novo Programa',
      start_time: '09:00',
      is_public: false,
    });

    const { result } = renderHook(() => useProgram('prog-1'), { wrapper: Wrapper });

    expect(result.current.error).toBeNull();
    expect(result.current.program?.id).toBe('prog-1');
    expect(result.current.program?.entries).toEqual([]);
  });
});
