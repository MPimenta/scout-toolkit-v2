import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../setup';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { getBoundTestDb } from '../../helpers/bound-test-db';
import { programs, user } from '../../../drizzle/schema';

const USER_ID = '550e8400-e29b-41d4-a716-446655440301';
const PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440302';

describe('Orgo event columns on programs', () => {
  beforeAll(async () => {
    requireLocalTestDatabase();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    requireLocalTestDatabase();
    await resetTestDatabase();
  });

  it('stores orgo_event_uuid and orgo_event_url on scout_toolkit_test only', async () => {
    const db = getBoundTestDb();
    await db.insert(user).values({ id: USER_ID, email: 'orgo@escoteiros.pt', name: 'Ana', role: 'user' });
    await db.insert(programs).values({
      id: PROGRAM_ID,
      name: 'Acampamento',
      date: '2026-07-12',
      start_time: '09:00',
      user_id: USER_ID,
      is_public: false,
      orgo_event_uuid: 'evt-uuid-1',
      orgo_event_url: 'https://eaep.escoteiros.pt/events/evt-uuid-1',
    });

    const [row] = await db.select().from(programs).where(eq(programs.id, PROGRAM_ID));
    expect(row?.orgo_event_uuid).toBe('evt-uuid-1');
    expect(row?.orgo_event_url).toBe('https://eaep.escoteiros.pt/events/evt-uuid-1');
  });
});
