import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { POST as postEvent } from '@/app/api/usage/events/route';
import { GET as purge } from '@/app/api/usage/purge/route';
import { POST as optOut, DELETE as optBackIn } from '@/app/api/usage/opt-out/route';
import { POST as addEntry } from '@/app/api/programs/[id]/entries/route';
import { linkVisitorToUser, purgeOldUsageEvents } from '@/lib/usage/record';
import { resetUsageRateLimit } from '@/lib/usage/rate-limit';
import { insertActivities } from '../../helpers/activity-categories';
import { withTestDatabase, type TestDatabaseHandle } from '../../helpers/database';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { programs, usageEvents, user } from '../../../drizzle/schema';

const mockAuth = vi.fn();
vi.mock('@/lib/auth/config', () => ({ auth: () => mockAuth() }));

const USER_ID = '550e8400-e29b-41d4-a716-446655440601';
const ACTIVITY_ID = '550e8400-e29b-41d4-a716-446655440603';
const PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440604';
const VISITOR = '8c1c5f6e-5a54-4d0a-9d52-3d3a4d7f0a11';
const BROWSER = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function event(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/usage/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': BROWSER, ...headers },
    body: JSON.stringify(body),
  });
}

const search = { type: 'search', text: 'jogo', filters: { ageGroup: ['scouts'] }, result_count: 7 };

describe('Usage tracking', () => {
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
    resetUsageRateLimit();
    mockAuth.mockResolvedValue(null);
    await db.insert(user).values({ id: USER_ID, email: 'uso@escoteiros.pt', name: 'Maria Uso', role: 'user' });
    await insertActivities(db, {
      id: ACTIVITY_ID,
      name: 'Jogo da bandeira',
      description: 'd',
      materials: 'm',
      approximate_duration_minutes: 30,
      group_sizes: ['medium'],
      effort_level: 'low',
      locations: ['inside'],
      age_groups: ['scouts'],
      is_approved: true,
    });
    await db.insert(programs).values({ id: PROGRAM_ID, name: 'Sábado', date: '2026-11-14', start_time: '09:30', user_id: USER_ID });
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    mockAuth.mockReset();
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  const all = () => db.select().from(usageEvents);

  it('stores a search with its filters, divisions and result count, and sets the visitor cookie', async () => {
    const response = await postEvent(event(search));
    expect(response.status).toBe(204);
    expect(response.headers.get('set-cookie')).toContain('visitor_id=');
    expect(response.headers.get('set-cookie')?.toLowerCase()).toContain('httponly');
    const [row] = await all();
    expect(row).toMatchObject({ type: 'search', user_id: null });
    expect(row!.payload).toMatchObject({ text: 'jogo', divisions: ['scouts'], result_count: 7 });
  });

  it('stores only the allowed fields (no ip, user agent or referrer)', async () => {
    await postEvent(event(search, { 'x-forwarded-for': '203.0.113.9', referer: 'https://example.com/' }));
    const [row] = await all();
    expect(JSON.stringify(row)).not.toMatch(/203\.0\.113\.9|example\.com|Mozilla/);
  });

  it('keeps the same visitor id and records the user when signed in', async () => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID, role: 'user' } });
    const response = await postEvent(event(search, { cookie: `visitor_id=${VISITOR}` }));
    expect(response.headers.get('set-cookie')).toBeNull();
    const [row] = await all();
    expect(row).toMatchObject({ visitor_id: VISITOR, user_id: USER_ID });
  });

  it('stores an app launch with the visitor and user ids and nothing else', async () => {
    const response = await postEvent(event({ type: 'app_launch' }));
    expect(response.status).toBe(204);
    expect(response.headers.get('set-cookie')).toContain('visitor_id=');
    const [row] = await all();
    expect(row).toMatchObject({ type: 'app_launch', user_id: null, activity_id: null, program_id: null, payload: null });

    mockAuth.mockResolvedValue({ user: { id: USER_ID } });
    await postEvent(event({ type: 'app_launch' }, { cookie: `visitor_id=${VISITOR}` }));
    expect((await all()).map((e) => e.user_id)).toContain(USER_ID);
  });

  it('does not store an app launch from a bot or when the flag is off', async () => {
    await postEvent(event({ type: 'app_launch' }, { 'user-agent': 'Googlebot/2.1' }));
    vi.stubEnv('FEATURES', '');
    const off = await postEvent(event({ type: 'app_launch' }));
    expect(off.status).toBe(404);
    expect(await all()).toHaveLength(0);
  });

  it('does not store an empty search', async () => {
    await postEvent(event({ type: 'search', text: '  ', filters: {}, result_count: 20 }));
    expect(await all()).toHaveLength(0);
  });

  it('stores a search with zero results', async () => {
    await postEvent(event({ ...search, result_count: 0 }));
    const [row] = await all();
    expect(row!.payload).toMatchObject({ result_count: 0 });
  });

  it('stores an activity view once per 30 minutes for the same visitor', async () => {
    const view = { type: 'activity_view', activity_id: ACTIVITY_ID };
    await postEvent(event(view, { cookie: `visitor_id=${VISITOR}` }));
    await postEvent(event(view, { cookie: `visitor_id=${VISITOR}` }));
    expect(await all()).toHaveLength(1);

    await db.update(usageEvents).set({ occurred_at: new Date(Date.now() - 31 * 60 * 1000) });
    await postEvent(event(view, { cookie: `visitor_id=${VISITOR}` }));
    expect(await all()).toHaveLength(2);
  });

  it('rejects unknown activities, malformed ids, unknown types and forged program_add', async () => {
    const bad = [
      { type: 'activity_view', activity_id: '550e8400-e29b-41d4-a716-446655449999' },
      { type: 'activity_view', activity_id: 'nope' },
      { type: 'click', x: 1 },
      { type: 'program_add', activity_id: ACTIVITY_ID, program_id: PROGRAM_ID },
      { type: 'search', text: 'x'.repeat(201), filters: {}, result_count: 1 },
    ];
    for (const body of bad) {
      const response = await postEvent(event(body));
      expect(response.status).toBe(400);
      expect((await response.json()).error.message).toMatch(/inválido|desconhecida/);
    }
    expect(await all()).toHaveLength(0);
  });

  it('skips bots, privacy signals and the opt-out cookie without setting a cookie', async () => {
    const skipped: Array<Record<string, string>> = [
      { 'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' },
      { 'user-agent': 'Mozilla/5.0 HeadlessChrome/120.0' },
      { 'sec-gpc': '1' },
      { dnt: '1' },
      { cookie: 'tracking_off=1' },
    ];
    for (const headers of skipped) {
      const response = await postEvent(event(search, headers));
      expect(response.status).toBe(204);
      expect(response.headers.get('set-cookie')).toBeNull();
    }
    expect(await all()).toHaveLength(0);
  });

  it('answers 404 and stores nothing when the flag is off', async () => {
    vi.stubEnv('FEATURES', '');
    const response = await postEvent(event(search));
    expect(response.status).toBe(404);
    expect(await all()).toHaveLength(0);
  });

  it('rate-limits one visitor', async () => {
    let last = 204;
    for (let i = 0; i < 62; i++) {
      last = (await postEvent(event(search, { cookie: `visitor_id=${VISITOR}` }))).status;
    }
    expect(last).toBe(429);
  });

  it('does not break the request when the database write fails', async () => {
    const { db: serverDb } = await import('@/lib/db/server');
    const spy = vi.spyOn(serverDb, 'insert').mockImplementation(() => {
      throw new Error('db down');
    });
    const response = await postEvent(event(search));
    spy.mockRestore();
    expect(response.status).toBe(204);
  });

  describe('program_add', () => {
    const ctx = { params: Promise.resolve({ id: PROGRAM_ID }) };
    const add = (body: unknown, headers: Record<string, string> = {}) =>
      addEntry(
        new NextRequest(`http://localhost:3000/api/programs/${PROGRAM_ID}/entries`, {
          method: 'POST',
          headers: { 'user-agent': BROWSER, ...headers },
          body: JSON.stringify(body),
        }),
        ctx
      );

    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: USER_ID, role: 'user', name: 'Maria Uso', email: 'uso@escoteiros.pt' } });
    });

    it('is recorded by the server with the user, activity and program', async () => {
      const response = await add({ entry_type: 'activity', activity_id: ACTIVITY_ID });
      expect(response.status).toBe(201);
      const [row] = await all();
      expect(row).toMatchObject({ type: 'program_add', user_id: USER_ID, activity_id: ACTIVITY_ID, program_id: PROGRAM_ID });
    });

    it('is not recorded when the addition fails validation, or for custom blocks', async () => {
      expect((await add({ entry_type: 'activity', activity_id: null })).status).toBe(400);
      expect((await add({ entry_type: 'custom', custom_title: 'Lanche', custom_duration_minutes: 15 })).status).toBe(201);
      expect(await all()).toHaveLength(0);
    });

    it('is not recorded when the flag is off, and still succeeds', async () => {
      vi.stubEnv('FEATURES', '');
      expect((await add({ entry_type: 'activity', activity_id: ACTIVITY_ID })).status).toBe(201);
      expect(await all()).toHaveLength(0);
    });
  });

  describe('attribution and retention', () => {
    it('attributes earlier anonymous events when the visitor signs in', async () => {
      await postEvent(event(search, { cookie: `visitor_id=${VISITOR}` }));
      await postEvent(event({ ...search, text: 'fogueira' }, { cookie: `visitor_id=${VISITOR}` }));
      expect((await all()).every((row) => row.user_id === null)).toBe(true);

      await linkVisitorToUser(VISITOR, USER_ID);
      expect((await all()).every((row) => row.user_id === USER_ID)).toBe(true);
    });

    it('does not take over events already attributed to another user', async () => {
      await db.insert(usageEvents).values({ type: 'search', visitor_id: VISITOR, user_id: USER_ID, payload: {} });
      const other = '550e8400-e29b-41d4-a716-446655440699';
      await db.insert(user).values({ id: other, email: 'outro@escoteiros.pt', name: 'Outro', role: 'user' });
      await linkVisitorToUser(VISITOR, other);
      expect((await all())[0]!.user_id).toBe(USER_ID);
    });

    it('keeps events anonymous (not deleted) when the user is deleted', async () => {
      await db.insert(usageEvents).values({ type: 'search', visitor_id: VISITOR, user_id: USER_ID, payload: {} });
      await db.delete(user).where(eq(user.id, USER_ID));
      const rows = await all();
      expect(rows).toHaveLength(1);
      expect(rows[0]!.user_id).toBeNull();
    });

    it('purges only events older than 13 months', async () => {
      const old = new Date();
      old.setMonth(old.getMonth() - 14);
      const recent = new Date();
      recent.setMonth(recent.getMonth() - 2);
      await db.insert(usageEvents).values([
        { type: 'search', visitor_id: VISITOR, occurred_at: old, payload: {} },
        { type: 'search', visitor_id: VISITOR, occurred_at: recent, payload: {} },
      ]);
      expect(await purgeOldUsageEvents()).toBe(1);
      expect(await all()).toHaveLength(1);
      expect(await purgeOldUsageEvents()).toBe(0);
    });

    it('the purge route needs the cron secret', async () => {
      vi.stubEnv('CRON_SECRET', 's3cret');
      const call = (headers: Record<string, string> = {}) =>
        purge(new NextRequest('http://localhost:3000/api/usage/purge', { headers }));
      expect((await call()).status).toBe(401);
      expect((await call({ authorization: 'Bearer wrong' })).status).toBe(401);
      expect((await call({ authorization: 'Bearer s3cret' })).status).toBe(200);
    });
  });

  describe('opt-out', () => {
    it('sets the opt-out cookie and removes the visitor id; opting back in clears it', async () => {
      const off = await optOut();
      expect(off.status).toBe(204);
      expect(off.headers.get('set-cookie')).toContain('tracking_off=1');
      expect(off.headers.get('set-cookie')).toMatch(/visitor_id=;/);

      const on = await optBackIn();
      expect(on.headers.get('set-cookie')).toMatch(/tracking_off=;/);
    });
  });

  it('exposes no endpoint that reads events', async () => {
    const { GET } = (await import('@/app/api/usage/events/route')) as { GET?: unknown };
    expect(GET).toBeUndefined();
  });
});
