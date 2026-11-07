import { act, renderHook, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { isBotUserAgent, shouldRecord } from '@/lib/usage/guard';
import { isEmptySearch, usageEventBodySchema } from '@/lib/usage/schemas';
import { allowUsageEvent, resetUsageRateLimit, USAGE_EVENTS_PER_MINUTE } from '@/lib/usage/rate-limit';
import { isVisitorId } from '@/lib/usage/visitor';
import { SEARCH_SETTLE_MS, useTrackActivityView, useTrackSearch } from '@/hooks/useUsageTracking';
import { EMPTY_FILTERS } from '@/lib/activities/filters';
import PrivacyPage from '@/app/privacy/page';
import { FeaturesProvider } from '@/components/providers/FeaturesProvider';
import { renderWithFeatures } from '../../helpers/render-with-features';

const BROWSER = 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';
const req = (headers: Record<string, string>) => new NextRequest('http://localhost/x', { headers });

describe('shouldRecord', () => {
  it('accepts an ordinary browser', () => {
    expect(shouldRecord(req({ 'user-agent': BROWSER }))).toBe(true);
  });

  it.each([
    ['a crawler', { 'user-agent': 'Googlebot/2.1' }],
    ['a headless browser', { 'user-agent': 'Mozilla/5.0 HeadlessChrome/120' }],
    ['no user agent', {}],
    ['Global Privacy Control', { 'user-agent': BROWSER, 'sec-gpc': '1' }],
    ['Do Not Track', { 'user-agent': BROWSER, dnt: '1' }],
    ['the opt-out cookie', { 'user-agent': BROWSER, cookie: 'tracking_off=1' }],
  ])('refuses %s', (_name, headers) => {
    expect(shouldRecord(req(headers as Record<string, string>))).toBe(false);
  });

  it('recognises common bots', () => {
    for (const ua of ['curl/8.0', 'python-requests/2.31', 'UptimeRobot/2.0', 'Lighthouse']) {
      expect(isBotUserAgent(ua)).toBe(true);
    }
  });
});

describe('event schemas', () => {
  it('accepts search and activity_view only', () => {
    expect(usageEventBodySchema.safeParse({ type: 'search', text: 'a', filters: {}, result_count: 3 }).success).toBe(true);
    expect(
      usageEventBodySchema.safeParse({ type: 'activity_view', activity_id: '550e8400-e29b-41d4-a716-446655440603' }).success
    ).toBe(true);
    expect(usageEventBodySchema.safeParse({ type: 'program_add', activity_id: 'x' }).success).toBe(false);
  });

  it('bounds the text and the lists', () => {
    expect(usageEventBodySchema.safeParse({ type: 'search', text: 'x'.repeat(201), filters: {}, result_count: 1 }).success).toBe(false);
    const tooMany = { ageGroup: Array.from({ length: 51 }, () => 'scouts') };
    expect(usageEventBodySchema.safeParse({ type: 'search', text: '', filters: tooMany, result_count: 1 }).success).toBe(false);
  });

  it('knows when a search is empty', () => {
    expect(isEmptySearch('', {})).toBe(true);
    expect(isEmptySearch(' ', { ageGroup: [] })).toBe(true);
    expect(isEmptySearch('', { ageGroup: ['scouts'] })).toBe(false);
    expect(isEmptySearch('jogo', {})).toBe(false);
  });
});

describe('visitor id and rate limit', () => {
  it('only accepts uuids', () => {
    expect(isVisitorId('8c1c5f6e-5a54-4d0a-9d52-3d3a4d7f0a11')).toBe(true);
    expect(isVisitorId('admin')).toBe(false);
    expect(isVisitorId(undefined)).toBe(false);
  });

  it('limits events per minute and recovers', () => {
    resetUsageRateLimit();
    for (let i = 0; i < USAGE_EVENTS_PER_MINUTE; i++) expect(allowUsageEvent('v', 1000)).toBe(true);
    expect(allowUsageEvent('v', 1000)).toBe(false);
    expect(allowUsageEvent('v', 1000 + 61_000)).toBe(true);
  });
});

describe('tracking hooks', () => {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({ ok: true }) as Response);
  const wrapper = (enabled: boolean) =>
    // eslint-disable-next-line react/display-name
    ({ children }: { children: React.ReactNode }) => (
      <FeaturesProvider enabled={enabled ? ['usage-tracking'] : []}>{children}</FeaturesProvider>
    );

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const sent = () => fetchMock.mock.calls.map((call) => JSON.parse(String(call[1]?.body)));

  it('sends one search once it has settled, not per keystroke', () => {
    const { rerender } = renderHook(({ filters }) => useTrackSearch(filters, 5, false), {
      wrapper: wrapper(true),
      initialProps: { filters: { ...EMPTY_FILTERS, search: 'j' } },
    });
    act(() => void vi.advanceTimersByTime(300));
    rerender({ filters: { ...EMPTY_FILTERS, search: 'jo' } });
    act(() => void vi.advanceTimersByTime(300));
    rerender({ filters: { ...EMPTY_FILTERS, search: 'jogo' } });
    act(() => void vi.advanceTimersByTime(SEARCH_SETTLE_MS + 10));
    expect(sent()).toEqual([{ type: 'search', text: 'jogo', filters: expect.any(Object), result_count: 5 }]);
  });

  it('sends nothing for an empty search, while loading, or when the flag is off', () => {
    renderHook(() => useTrackSearch(EMPTY_FILTERS, 20, false), { wrapper: wrapper(true) });
    renderHook(() => useTrackSearch({ ...EMPTY_FILTERS, search: 'jogo' }, 20, true), { wrapper: wrapper(true) });
    renderHook(() => useTrackSearch({ ...EMPTY_FILTERS, search: 'jogo' }, 20, false), { wrapper: wrapper(false) });
    act(() => void vi.advanceTimersByTime(2000));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not repeat an identical search', () => {
    const filters = { ...EMPTY_FILTERS, search: 'jogo' };
    const { rerender } = renderHook(({ total }) => useTrackSearch(filters, total, false), {
      wrapper: wrapper(true),
      initialProps: { total: 5 },
    });
    act(() => void vi.advanceTimersByTime(SEARCH_SETTLE_MS + 10));
    rerender({ total: 5 });
    rerender({ total: 6 });
    act(() => void vi.advanceTimersByTime(SEARCH_SETTLE_MS + 10));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends one view per activity and nothing when the flag is off', () => {
    const { rerender } = renderHook(({ id }) => useTrackActivityView(id), {
      wrapper: wrapper(true),
      initialProps: { id: 'a1' as string | undefined },
    });
    rerender({ id: 'a1' });
    expect(sent()).toEqual([{ type: 'activity_view', activity_id: 'a1' }]);

    fetchMock.mockClear();
    renderHook(() => useTrackActivityView('a2'), { wrapper: wrapper(false) });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never throws when the request fails', () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    expect(() => renderHook(() => useTrackActivityView('a3'), { wrapper: wrapper(true) })).not.toThrow();
  });
});

describe('privacy page', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('says nothing is recorded when the flag is off', () => {
    renderWithFeatures(<PrivacyPage />, { features: [] });
    expect(screen.getByText('De momento, a plataforma não regista dados de utilização.')).toBeInTheDocument();
    expect(screen.queryByText('Desligar o registo neste browser')).not.toBeInTheDocument();
  });

  it('names the three events, the retention and the contact when the flag is on', () => {
    renderWithFeatures(<PrivacyPage />, { features: ['usage-tracking'] });
    expect(screen.getByText(/as pesquisas que fazes/)).toBeInTheDocument();
    expect(screen.getByText(/as atividades cujos detalhes abres/)).toBeInTheDocument();
    expect(screen.getByText(/adicionas a programas/)).toBeInTheDocument();
    expect(screen.getByText(/apagados ao fim de 13 meses/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'geral@escoteiros.pt' })).toHaveAttribute('href', 'mailto:geral@escoteiros.pt');
  });

  it('turns recording off and back on', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }) as Response);
    vi.stubGlobal('fetch', fetchMock);
    renderWithFeatures(<PrivacyPage />, { features: ['usage-tracking'] });
    fireEvent.click(screen.getByRole('button', { name: 'Desligar o registo neste browser' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('desligado'));
    expect(fetchMock).toHaveBeenCalledWith('/api/usage/opt-out', { method: 'POST' });
    fireEvent.click(screen.getByRole('button', { name: 'Voltar a ligar o registo' }));
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith('/api/usage/opt-out', { method: 'DELETE' }));
  });
});
