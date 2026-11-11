import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/admin/usage/summary/route';
import { daysBetween, lisbonDay, periodStart } from '@/lib/usage/analytics';
import { insertActivities } from '../../helpers/activity-categories';
import { withTestDatabase, type TestDatabaseHandle } from '../../helpers/database';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { usageEvents, user } from '../../../drizzle/schema';

type Gate = { user: { id: string; role: string } } | { error: NextResponse };
let gate: Gate = { user: { id: 'admin', role: 'admin' } };
vi.mock('@/lib/auth/utils', () => ({ requireAdminApi: async () => gate }));
const SCOUTS_ACTIVITY = '550e8400-e29b-41d4-a716-446655440702';
const ROVERS_ACTIVITY = '550e8400-e29b-41d4-a716-446655440703';
const MARIA = '550e8400-e29b-41d4-a716-446655440704';
const SEM_NOME = '550e8400-e29b-41d4-a716-446655440705';
const V1 = '8c1c5f6e-5a54-4d0a-9d52-3d3a4d7f0a01';
const V2 = '8c1c5f6e-5a54-4d0a-9d52-3d3a4d7f0a02';

const ago = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

function summary(query = '') {
  return GET(new NextRequest(`http://localhost:3000/api/admin/usage/summary${query}`));
}

describe('Admin usage analytics', () => {
  let db: TestDatabaseHandle['db'];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    requireLocalTestDatabase();
    const setup = await withTestDatabase();
    db = setup.db;
    cleanup = setup.cleanup;
  });

  beforeEach(async () => {
    vi.stubEnv('FEATURES', 'usage-tracking');
    gate = { user: { id: 'admin', role: 'admin' } };
    await db.insert(user).values([
      { id: MARIA, email: 'maria-uso@escoteiros.pt', name: 'Maria', role: 'user' },
      { id: SEM_NOME, email: 'sem-nome@escoteiros.pt', name: null, role: 'user' },
    ]);
    const base = {
      description: 'd',
      materials: 'm',
      approximate_duration_minutes: 30,
      group_sizes: ['medium' as const],
      effort_level: 'low' as const,
      locations: ['inside' as const],
      is_approved: true,
    };
    await insertActivities(db, [
      { ...base, id: SCOUTS_ACTIVITY, name: 'Jogo da bandeira', age_groups: ['scouts'] },
      { ...base, id: ROVERS_ACTIVITY, name: 'Caminhada noturna', age_groups: ['rovers'] },
    ]);

    const search = (text: string, divisions: string[], results: number, occurred_at = ago(1), extra = {}) => ({
      type: 'search' as const,
      visitor_id: V1,
      occurred_at,
      payload: { text, filters: {}, divisions, result_count: results },
      ...extra,
    });
    await db.insert(usageEvents).values([
      search('Jogo', ['scouts'], 10),
      search('jogo ', ['scouts'], 6),
      search('jogo', [], 8, ago(1), { visitor_id: V2, user_id: MARIA }),
      search('xyz', ['rovers'], 0),
      search('xyz', [], 0),
      search('', ['scouts'], 12), // filter-only search
      search('antiga', [], 3, ago(20)),
      ...Array.from({ length: 4 }, (_, i) => ({
        type: 'activity_view' as const,
        visitor_id: i < 3 ? V1 : V2,
        user_id: i === 3 ? MARIA : null,
        activity_id: SCOUTS_ACTIVITY,
        occurred_at: ago(2),
      })),
      { type: 'activity_view' as const, visitor_id: V1, activity_id: ROVERS_ACTIVITY, occurred_at: ago(2) },
      { type: 'program_add' as const, visitor_id: V2, user_id: MARIA, activity_id: SCOUTS_ACTIVITY, occurred_at: ago(2) },
      { type: 'program_add' as const, visitor_id: V2, user_id: SEM_NOME, activity_id: ROVERS_ACTIVITY, occurred_at: ago(2) },
      { type: 'activity_view' as const, visitor_id: V1, activity_id: SCOUTS_ACTIVITY, occurred_at: ago(60) },
    ]);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('counts totals for the default 30 days', async () => {
    const body = await (await summary()).json();
    expect(body.period).toBe('30d');
    expect(body.totals).toMatchObject({ searches: 7, views: 5, program_adds: 2, visitors: 2, signed_in_users: 2 });
  });

  it('respects the period', async () => {
    const week = await (await summary('?period=7d')).json();
    expect(week.totals.searches).toBe(6);
    const year = await (await summary('?period=13m')).json();
    expect(year.totals.views).toBe(6);
  });

  it('respects the division: searches that filtered by it, activities that belong to it', async () => {
    const body = await (await summary('?division=scouts')).json();
    expect(body.totals).toMatchObject({ searches: 3, views: 4, program_adds: 1 });
    expect(body.top_viewed.map((r: { name: string }) => r.name)).toEqual(['Jogo da bandeira']);
  });

  it('lists viewed versus added with conversion', async () => {
    const body = await (await summary()).json();
    expect(body.top_viewed[0]).toMatchObject({ name: 'Jogo da bandeira', views: 4, adds: 1, conversion: 0.25 });
    expect(body.top_added.map((r: { name: string }) => r.name).sort()).toEqual(['Caminhada noturna', 'Jogo da bandeira']);
    expect(body.top_viewed.find((r: { name: string }) => r.name === 'Caminhada noturna')).toMatchObject({ views: 1, adds: 1, conversion: 1 });
  });

  it('shows an activity added without views with no conversion', async () => {
    await db.insert(usageEvents).values({ type: 'program_add', visitor_id: V1, activity_id: ROVERS_ACTIVITY, occurred_at: ago(400) });
    const body = await (await summary('?period=13m')).json();
    expect(body.top_added.find((r: { name: string }) => r.name === 'Caminhada noturna').adds).toBeGreaterThan(0);
  });

  it('merges search text ignoring case and spaces, and leaves filter-only searches out of the text lists', async () => {
    const body = await (await summary()).json();
    expect(body.top_searches[0]).toMatchObject({ text: 'jogo', count: 3, avg_results: 8 });
    expect(body.top_searches.map((r: { text: string }) => r.text)).not.toContain('');
  });

  it('lists searches with no results', async () => {
    const body = await (await summary()).json();
    expect(body.no_result_searches).toEqual([{ text: 'xyz', count: 2 }]);
  });

  it('counts searches per division, keeping searches without a division apart', async () => {
    const body = await (await summary()).json();
    const by = Object.fromEntries(body.searches_by_division.map((r: { division: string; count: number }) => [r.division, r.count]));
    expect(by).toMatchObject({ scouts: 3, rovers: 1, sem_divisao: 3 });
  });

  it('lists signed-in users by name, without e-mail, and not anonymous visitors', async () => {
    const body = await (await summary()).json();
    const names = body.top_users.map((u: { name: string }) => u.name);
    expect(names).toContain('Maria');
    expect(names).toContain('');
    expect(JSON.stringify(body)).not.toContain('@escoteiros.pt');
    expect(body.top_users).toHaveLength(2);
    expect(body.top_users.find((u: { name: string }) => u.name === 'Maria')).toMatchObject({ searches: 1, views: 1, program_adds: 1 });
  });

  it('fills days without events with zero', async () => {
    const body = await (await summary('?period=7d')).json();
    expect(body.daily.length).toBeGreaterThanOrEqual(7);
    expect(body.daily.some((d: { searches: number; views: number; program_adds: number }) => d.searches + d.views + d.program_adds === 0)).toBe(true);
    expect(body.daily.reduce((n: number, d: { searches: number }) => n + d.searches, 0)).toBe(6);
  });

  it('is empty, not an error, when there are no events', async () => {
    await db.delete(usageEvents);
    const body = await (await summary()).json();
    expect(body.totals).toMatchObject({ searches: 0, views: 0, program_adds: 0 });
    expect(body.top_viewed).toEqual([]);
  });

  it('rejects an unknown period or division with a Portuguese message', async () => {
    for (const query of ['?period=1y', '?division=lobos']) {
      const response = await summary(query);
      expect(response.status).toBe(400);
      expect((await response.json()).error.message).toMatch(/inválidos/);
    }
  });

  it('answers 401 and 403 from the admin gate, and 404 when the flag is off', async () => {
    gate = { error: NextResponse.json({ error: { code: 'AUTHENTICATION_ERROR' } }, { status: 401 }) };
    expect((await summary()).status).toBe(401);
    gate = { error: NextResponse.json({ error: { code: 'AUTHORIZATION_ERROR' } }, { status: 403 }) };
    expect((await summary()).status).toBe(403);
    gate = { user: { id: 'admin', role: 'admin' } };
    vi.stubEnv('FEATURES', '');
    expect((await summary()).status).toBe(404);
  });
});

describe('usage analytics helpers', () => {
  it('starts the period at the right distance', () => {
    const now = new Date('2026-11-15T12:00:00Z');
    expect(periodStart('7d', now).toISOString()).toBe('2026-11-08T12:00:00.000Z');
    expect(periodStart('13m', now).getFullYear()).toBe(2025);
  });

  it('lists every Lisbon day without gaps', () => {
    const days = daysBetween(new Date('2026-11-01T10:00:00Z'), new Date('2026-11-04T10:00:00Z'));
    expect(days).toEqual(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04']);
    expect(lisbonDay(new Date('2026-06-30T23:30:00Z'))).toBe('2026-07-01'); // summer time: already tomorrow in Lisbon
  });
});
