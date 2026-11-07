import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { insertActivities } from '../../helpers/activity-categories'
import { NextRequest } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { POST as addEntry, PUT as replaceEntries } from '@/app/api/programs/[id]/entries/route';
import { GET as getProgram, PUT as updateProgram } from '@/app/api/programs/[id]/route';
import { GET as listPrograms } from '@/app/api/programs/route';
import { loadProgramForExport } from '@/lib/export/load-program';
import { withTestDatabase, type TestDatabaseHandle } from '../../helpers/database';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { activityTypes, programEntries, programs, user } from '../../../drizzle/schema';

const mockAuth = vi.fn();
vi.mock('@/lib/auth/config', () => ({ auth: () => mockAuth() }));

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440401';
const PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440402';
const TYPE_ID = '550e8400-e29b-41d4-a716-446655440403';
const LONG_ID = '550e8400-e29b-41d4-a716-446655440404'; // 90 min
const SHORT_ID = '550e8400-e29b-41d4-a716-446655440405'; // 30 min

const ctx = { params: Promise.resolve({ id: PROGRAM_ID }) };
const req = (method: string, body?: unknown, url = `http://localhost:3000/api/programs/${PROGRAM_ID}/entries`) =>
  new NextRequest(url, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

describe('Program schedule', () => {
  let db: TestDatabaseHandle['db'];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    requireLocalTestDatabase();
    const setup = await withTestDatabase();
    db = setup.db;
    cleanup = setup.cleanup;
  });

  beforeEach(async () => {
    await db.insert(user).values({ id: OWNER_ID, email: 'dono-horario@escoteiros.pt', name: 'Dono', role: 'user' });
    await db.insert(activityTypes).values({ id: TYPE_ID, name: 'Jogo' });
    const base = {
      description: 'd',
      materials: 'm',
      group_sizes: ['medium' as const],
      effort_level: 'low' as const,
      locations: ['inside' as const],
      age_groups: ['scouts' as const],
      activity_type_id: TYPE_ID,
      is_approved: true,
    };
    await insertActivities(db, [
      { ...base, id: LONG_ID, name: 'Construção de Abrigo', approximate_duration_minutes: 90 },
      { ...base, id: SHORT_ID, name: 'Jogo Curto', approximate_duration_minutes: 30 },
    ]);
    await db.insert(programs).values({
      id: PROGRAM_ID,
      name: 'Reunião de sábado',
      date: '2026-11-14',
      start_time: '09:30',
      user_id: OWNER_ID,
    });
    mockAuth.mockResolvedValue({ user: { id: OWNER_ID, role: 'user', name: 'Dono', email: 'dono-horario@escoteiros.pt' } });
  });

  afterEach(async () => {
    mockAuth.mockReset();
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  async function stored() {
    return db
      .select({
        position: programEntries.position,
        start: programEntries.start_time,
        end: programEntries.end_time,
        title: programEntries.custom_title,
        activity: programEntries.activity_id,
      })
      .from(programEntries)
      .where(eq(programEntries.program_id, PROGRAM_ID))
      .orderBy(asc(programEntries.position));
  }
  const times = async () => (await stored()).map((e) => `${e.start.slice(0, 5)}-${e.end.slice(0, 5)}`);

  it('adds the first entry to an empty program without a position, ignoring client times', async () => {
    const response = await addEntry(
      req('POST', { entry_type: 'activity', activity_id: LONG_ID, start_time: '01:00', end_time: '02:00' }),
      ctx
    );
    expect(response.status).toBe(201);
    const { entry } = await response.json();
    expect(entry).toMatchObject({ position: 0, start_time: '09:30', end_time: '11:00' });
    expect(await times()).toEqual(['09:30-11:00']);
  });

  it('accepts position 0 and moves later entries down', async () => {
    await addEntry(req('POST', { entry_type: 'activity', activity_id: LONG_ID }), ctx);
    const response = await addEntry(
      req('POST', { entry_type: 'custom', custom_title: 'Abertura', custom_duration_minutes: 15, position: 0 }),
      ctx
    );
    expect(response.status).toBe(201);
    expect((await stored()).map((e) => e.title ?? e.activity)).toEqual(['Abertura', LONG_ID]);
    expect(await times()).toEqual(['09:30-09:45', '09:45-11:15']);
  });

  it('rejects an activity entry without an activity', async () => {
    const response = await addEntry(req('POST', { entry_type: 'activity', activity_id: null }), ctx);
    expect(response.status).toBe(400);
  });

  it('removes from the middle and recalculates', async () => {
    await addEntry(req('POST', { entry_type: 'activity', activity_id: LONG_ID }), ctx);
    await addEntry(req('POST', { entry_type: 'custom', custom_title: 'Lanche', custom_duration_minutes: 15 }), ctx);
    await addEntry(req('POST', { entry_type: 'activity', activity_id: SHORT_ID }), ctx);
    expect(await times()).toEqual(['09:30-11:00', '11:00-11:15', '11:15-11:45']);

    const response = await replaceEntries(
      req('PUT', {
        entries: [
          { entry_type: 'activity', activity_id: LONG_ID },
          { entry_type: 'activity', activity_id: SHORT_ID },
        ],
      }),
      ctx
    );
    expect(response.status).toBe(200);
    expect((await stored()).map((e) => e.position)).toEqual([0, 1]);
    expect(await times()).toEqual(['09:30-11:00', '11:00-11:30']);
  });

  it('reorders and recalculates', async () => {
    await replaceEntries(
      req('PUT', {
        entries: [
          { entry_type: 'activity', activity_id: SHORT_ID },
          { entry_type: 'activity', activity_id: LONG_ID },
        ],
      }),
      ctx
    );
    expect(await times()).toEqual(['09:30-10:00', '10:00-11:30']);
  });

  it('moves every entry when the start time changes', async () => {
    await addEntry(req('POST', { entry_type: 'activity', activity_id: LONG_ID }), ctx);
    await addEntry(req('POST', { entry_type: 'custom', custom_title: 'Lanche', custom_duration_minutes: 15 }), ctx);
    const response = await updateProgram(
      req('PUT', { name: 'Reunião de sábado', date: '2026-11-14', start_time: '10:00' }, `http://localhost:3000/api/programs/${PROGRAM_ID}`),
      ctx
    );
    expect(response.status).toBe(200);
    expect(await times()).toEqual(['10:00-11:30', '11:30-11:45']);
  });

  it('shows the same total in the list, the program and the export (90 + 15 + 15 = 2h)', async () => {
    await addEntry(req('POST', { entry_type: 'activity', activity_id: LONG_ID }), ctx);
    await addEntry(req('POST', { entry_type: 'custom', custom_title: 'Lanche', custom_duration_minutes: 15 }), ctx);
    await addEntry(req('POST', { entry_type: 'custom', custom_title: 'Arrumar', custom_duration_minutes: 15 }), ctx);

    const list = await (await listPrograms(new NextRequest('http://localhost:3000/api/programs'))).json();
    const program = await (await getProgram(req('GET', undefined, `http://localhost:3000/api/programs/${PROGRAM_ID}`), ctx)).json();
    const exported = await loadProgramForExport(PROGRAM_ID);

    expect(Number(list.programs[0].total_duration_minutes)).toBe(120);
    expect(program.program.summary.total_duration_minutes).toBe(120);
    expect(program.program.entries.at(-1).end_time).toBe('11:30');
    expect(exported!.entries.at(-1)!.end_time).toBe('11:30');
  });
});
