import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import UsagePage from '@/app/admin/utilizacao/page';
import type { UsageSummary } from '@/lib/usage/analytics-shared';

const summary: UsageSummary = {
  period: '30d',
  division: null,
  from: '2026-10-01T00:00:00.000Z',
  totals: { searches: 7, views: 5, program_adds: 2, visitors: 2, signed_in_users: 1 },
  daily: [
    { date: '2026-11-01', searches: 2, views: 1, program_adds: 0 },
    { date: '2026-11-02', searches: 0, views: 0, program_adds: 0 },
  ],
  top_viewed: [{ activity_id: 'a1', name: 'Jogo da bandeira', views: 4, adds: 1, conversion: 0.25 }],
  top_added: [{ activity_id: 'a2', name: 'Caminhada noturna', views: 0, adds: 3, conversion: null }],
  top_searches: [{ text: 'jogo', count: 3, avg_results: 8 }],
  no_result_searches: [{ text: 'xyz', count: 2 }],
  searches_by_division: [
    { division: 'scouts', count: 3 },
    { division: 'sem_divisao', count: 2 },
  ],
  top_users: [
    { user_id: 'u1', name: 'Maria', searches: 1, views: 1, program_adds: 1 },
    { user_id: 'u2', name: '', searches: 1, views: 0, program_adds: 0 },
  ],
};

describe('Admin usage page', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => summary } as Response);
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows totals, lists, conversion, division labels and names', async () => {
    render(<UsagePage />);
    expect(screen.getByRole('status')).toHaveTextContent('A carregar');
    expect(await screen.findByText('Jogo da bandeira')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('Caminhada noturna')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument(); // added without views: no conversion
    expect(screen.getByText('xyz')).toBeInTheDocument();
    expect(screen.getByText('Sem divisão')).toBeInTheDocument();
    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.getByText('Utilizador sem nome')).toBeInTheDocument();
    expect(screen.getByText(/Valores indicativos/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jogo da bandeira' })).toHaveAttribute('href', '/activities/a1');
  });

  it('asks again when the period or the division changes', async () => {
    render(<UsagePage />);
    await screen.findByText('Jogo da bandeira');
    expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/usage/summary?period=30d');

    fireEvent.click(screen.getByRole('button', { name: '7 dias' }));
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/usage/summary?period=7d'));
    expect(screen.getByRole('button', { name: '7 dias' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Escoteiros (10-14)' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/usage/summary?period=7d&division=scouts')
    );
  });

  it('says there are no events when the selection is empty', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ...summary, totals: { searches: 0, views: 0, program_adds: 0, visitors: 0, signed_in_users: 0 }, top_viewed: [], top_added: [] }),
    } as Response);
    render(<UsagePage />);
    expect(await screen.findByText('Sem eventos para esta seleção.')).toBeInTheDocument();
  });

  it('shows an error when the request fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) } as Response);
    render(<UsagePage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');
  });
});
