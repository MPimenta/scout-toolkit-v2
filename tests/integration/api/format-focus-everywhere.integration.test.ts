import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { GET as listActivities } from '@/app/api/activities/route';
import { GET as getProgram } from '@/app/api/programs/[id]/route';
import { applySuggestion, checkValueSuggestion } from '@/lib/suggestions';
import { loadProgramForExport } from '@/lib/export/load-program';
import { withTestDatabase, type TestDatabaseHandle } from '../../helpers/database';
import { insertActivities } from '../../helpers/activity-categories';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { seedFormatAndFocus } from '../../helpers/reference-values';
import { activities, activityFocuses, activityFormats, programEntries, programs, user } from '../../../drizzle/schema';

const mockAuth = vi.fn();
vi.mock('@/lib/auth/config', () => ({ auth: () => mockAuth() }));

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440801';
const PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440802';
const WITH_KIND = '550e8400-e29b-41d4-a716-446655440803';
const WITHOUT_KIND = '550e8400-e29b-41d4-a716-446655440804';
const OTHER = '550e8400-e29b-41d4-a716-446655440805';

/** Format and focus replace the activity type in the catalogue, the programs, the exports and the suggestions. */
describe('Format and focus where the activity type used to be', () => {
  let db: TestDatabaseHandle['db'];
  let cleanup: () => Promise<void>;
  let refs: Awaited<ReturnType<typeof seedFormatAndFocus>>;

  beforeAll(async () => {
    requireLocalTestDatabase();
    const setup = await withTestDatabase();
    db = setup.db;
    cleanup = setup.cleanup;
  });

  beforeEach(async () => {
    refs = await seedFormatAndFocus(db);
    const base = {
      materials: 'm',
      approximate_duration_minutes: 30,
      effort_level: 'low' as const,
      is_approved: true,
    };
    await insertActivities(db, [
      { ...base, id: WITH_KIND, name: 'Jogo do Lenço', description: 'Corrida', instructions: 'Cada patrulha guarda o seu lenço', ...refs },
      { ...base, id: WITHOUT_KIND, name: 'Sem Classificação', description: 'Nada a declarar' },
      { ...base, id: OTHER, name: 'Outra Atividade', description: 'Outra', ...refs },
    ]);
    await db.insert(user).values({ id: OWNER_ID, email: 'dono-tipo@escoteiros.pt', name: 'Dono', role: 'user' });
    await db.insert(programs).values({ id: PROGRAM_ID, name: 'Reunião', date: '2026-11-14', start_time: '09:30', user_id: OWNER_ID });
    await db.insert(programEntries).values([
      { program_id: PROGRAM_ID, position: 0, start_time: '09:30', end_time: '10:00', entry_type: 'activity', activity_id: WITH_KIND },
      { program_id: PROGRAM_ID, position: 1, start_time: '10:00', end_time: '10:30', entry_type: 'activity', activity_id: WITHOUT_KIND },
    ]);
    mockAuth.mockResolvedValue({ user: { id: OWNER_ID, role: 'user', name: 'Dono', email: 'dono-tipo@escoteiros.pt' } });
  });

  afterEach(async () => {
    mockAuth.mockReset();
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  const catalogue = async (qs: string) => {
    const response = await listActivities(new NextRequest(`http://localhost:3000/api/activities?${qs}`));
    return { status: response.status, body: (await response.json()) as { activities: { id: string; name: string }[]; pagination: { total: number } } };
  };

  describe('the catalogue serving the program page', () => {
    it('returns exactly the activities asked for by id, whatever the page size', async () => {
      const { status, body } = await catalogue(`ids=${WITH_KIND},${OTHER}&limit=1`);
      expect(status).toBe(200);
      expect(body.activities.map((a) => a.id).sort()).toEqual([OTHER, WITH_KIND].sort());
      expect(body.pagination.total).toBe(2);
    });

    it('returns more than a page of them (up to 100)', async () => {
      const many = Array.from({ length: 25 }, (_, i) => ({
        id: `550e8400-e29b-41d4-a716-4466554409${String(i).padStart(2, '0')}`,
        name: `Atividade ${i}`,
        description: 'd',
        materials: 'm',
        approximate_duration_minutes: 20,
        effort_level: 'low' as const,
        is_approved: true,
        ...refs,
      }));
      await insertActivities(db, many);
      const { body } = await catalogue(`ids=${many.map((a) => a.id).join(',')}`);
      expect(body.activities).toHaveLength(25);
    });

    it('searches the instructions as well as the title, description and materials', async () => {
      expect((await catalogue('search=guarda')).body.activities.map((a) => a.name)).toEqual(['Jogo do Lenço']);
      expect((await catalogue('search=LENÇO')).body.activities.map((a) => a.name)).toEqual(['Jogo do Lenço']);
      expect((await catalogue('search=declarar')).body.activities.map((a) => a.name)).toEqual(['Sem Classificação']);
    });

    it('answers with no activity types, and ignores the removed activity_type parameter', async () => {
      const { status, body } = await catalogue(`activity_type=${WITH_KIND}&ids=${WITH_KIND}`);
      expect(status).toBe(200);
      expect(body.activities).toHaveLength(1);
      expect(body.activities[0]).not.toHaveProperty('activity_types');
      expect(body.activities[0]).toMatchObject({ format: { code: 'jogo' }, focus: { code: 'cooperacao' } });
    });
  });

  describe('the program', () => {
    it('returns format, focus and secondary focus for each activity entry, and null for an unclassified one', async () => {
      const response = await getProgram(new NextRequest(`http://localhost:3000/api/programs/${PROGRAM_ID}`), {
        params: Promise.resolve({ id: PROGRAM_ID }),
      });
      expect(response.status).toBe(200);
      const body = (await response.json()) as { program: { entries: { activity: Record<string, unknown> | null }[] } };
      const [first, second] = body.program.entries;
      expect(first!.activity).toMatchObject({
        format: { code: 'jogo', name: 'Jogo' },
        focus: { code: 'cooperacao' },
        secondary_focus: { code: 'lideranca' },
      });
      expect(first!.activity).not.toHaveProperty('activity_types');
      expect(second!.activity).toMatchObject({ format: null, focus: null, secondary_focus: null });
    });

    it('exports the same values, and an unclassified activity exports without them', async () => {
      const program = await loadProgramForExport(PROGRAM_ID);
      const [first, second] = program!.entries;
      expect(first!.activity).toMatchObject({ format: 'Jogo', focus: 'Cooperação', secondaryFocus: 'Liderança' });
      expect(second!.activity).toMatchObject({ format: null, focus: null, secondaryFocus: null });
    });
  });

  describe('edit suggestions for the format and the focuses', () => {
    const idOf = async (code: string) => {
      const [row] = await db.select({ id: activityFocuses.id }).from(activityFocuses).where(eq(activityFocuses.code, code));
      return row!.id;
    };

    it('accepts an existing format or focus', async () => {
      const [format] = await db.select({ id: activityFormats.id }).from(activityFormats).where(eq(activityFormats.code, 'quebra-gelo'));
      expect(await checkValueSuggestion('format_id', format!.id, WITH_KIND)).toBeNull();
      expect(await checkValueSuggestion('focus_id', await idOf('confianca'), WITH_KIND)).toBeNull();
    });

    it('rejects an id that is not a format or a focus', async () => {
      expect(await checkValueSuggestion('format_id', '550e8400-e29b-41d4-a716-446655440999', WITH_KIND)).toBe('Formato inválido');
      expect(await checkValueSuggestion('focus_id', '550e8400-e29b-41d4-a716-446655440999', WITH_KIND)).toBe('Foco inválido');
      expect(await checkValueSuggestion('secondary_focus_id', 'not-a-uuid', WITH_KIND)).toBe('Valor inválido');
    });

    it('keeps the main focus different from the secondary focus', async () => {
      // WITH_KIND has the focus Cooperação and the secondary focus Liderança
      expect(await checkValueSuggestion('secondary_focus_id', refs.focus_id, WITH_KIND)).toBe(
        'O foco secundário tem de ser diferente do foco principal'
      );
      expect(await checkValueSuggestion('focus_id', refs.secondary_focus_id, WITH_KIND)).toBe(
        'O foco secundário tem de ser diferente do foco principal'
      );
    });

    it('sets the column when an accepted suggestion is applied', async () => {
      const confianca = await idOf('confianca');
      await applySuggestion('focus_id', confianca, WITH_KIND);
      const [row] = await db.select({ focus_id: activities.focus_id }).from(activities).where(eq(activities.id, WITH_KIND));
      expect(row!.focus_id).toBe(confianca);
    });
  });
});
