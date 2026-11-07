import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createActivity } from '@/app/api/activities/route';
import { GET as myActivities } from '@/app/api/activities/mine/route';
import { POST as suggestEdit, GET as listSuggestions } from '@/app/api/activities/[id]/suggestions/route';
import { withTestDatabase, type TestDatabaseHandle } from '../../helpers/database';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { activities, editSuggestions, user } from '../../../drizzle/schema';

const mockAuth = vi.fn();
vi.mock('@/lib/auth/config', () => ({ auth: () => mockAuth() }));

const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440301';
const ACTIVITY_ID = '550e8400-e29b-41d4-a716-446655440302';

const params = { params: Promise.resolve({ id: ACTIVITY_ID }) };
const json = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/x', { method: 'POST', body: JSON.stringify(body) });

describe('Handler guards for switched-off features', () => {
  let db: TestDatabaseHandle['db'];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    requireLocalTestDatabase();
    const setup = await withTestDatabase();
    db = setup.db;
    cleanup = setup.cleanup;
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    mockAuth.mockReset();
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  async function signInMember() {
    await db.insert(user).values({ id: MEMBER_ID, email: 'membro-flags@escoteiros.pt', name: 'Membro', role: 'user' });
    mockAuth.mockResolvedValue({ user: { id: MEMBER_ID, role: 'user', email: 'membro-flags@escoteiros.pt', name: 'Membro' } });
  }

  describe('activity-proposals off', () => {
    it('POST /api/activities returns 404 and creates nothing', async () => {
      vi.stubEnv('FEATURES', '');
      await signInMember();
      const response = await createActivity(json({ name: 'Proposta escondida' }));
      expect(response.status).toBe(404);
      expect(await db.select().from(activities)).toHaveLength(0);
    });

    it('GET /api/activities/mine returns 404', async () => {
      vi.stubEnv('FEATURES', '');
      await signInMember();
      expect((await myActivities()).status).toBe(404);
    });
  });

  describe('activity-proposals on', () => {
    it('the handlers run (guest gets 401, member gets their list)', async () => {
      vi.stubEnv('FEATURES', 'activity-proposals');
      mockAuth.mockResolvedValue(null);
      expect((await createActivity(json({ name: 'x' }))).status).toBe(401);
      await signInMember();
      const mine = await myActivities();
      expect(mine.status).toBe(200);
    });
  });

  describe('edit-suggestions', () => {
    it('returns 404 for POST and GET while off, and stores nothing', async () => {
      vi.stubEnv('FEATURES', '');
      await signInMember();
      expect((await suggestEdit(json({ field: 'name', value: 'Novo nome' }), params)).status).toBe(404);
      expect((await listSuggestions(new NextRequest('http://localhost:3000/api/x'), params)).status).toBe(404);
      expect(await db.select().from(editSuggestions)).toHaveLength(0);
    });

    it('reaches the handler while on', async () => {
      vi.stubEnv('FEATURES', 'edit-suggestions');
      mockAuth.mockResolvedValue(null);
      expect((await suggestEdit(json({ field: 'name', value: 'Novo nome' }), params)).status).toBe(401);
    });
  });
});
