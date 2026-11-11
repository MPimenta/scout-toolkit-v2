import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { setupTestDatabase, teardownTestDatabase, resetTestDatabase } from '../../setup';
import { db } from '@/lib/db/server';
import {
  activities,
  activityFocuses,
  activityFormats,
  activitySources,
  challenges,
} from '../../../drizzle/schema';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { applyProgressMatrix } from '@/lib/reference-data/progress-matrix';
import { applyActivityFormatsAndFocuses } from '@/lib/reference-data/activity-formats-focuses';
import { applyActivitySources } from '@/lib/reference-data/activity-sources';
import { contentHash, upsertSelection } from '@/lib/activities/baseline-db';
import type { PlannedActivity } from '@/lib/activities/baseline-plan';
import type { ActivityWrite } from '@/lib/activities/write';

async function refIds() {
  const [format] = await db.select({ id: activityFormats.id }).from(activityFormats).where(eq(activityFormats.code, 'jogo'));
  const [focus] = await db.select({ id: activityFocuses.id }).from(activityFocuses).where(eq(activityFocuses.code, 'cooperacao'));
  const [secondary] = await db.select({ id: activityFocuses.id }).from(activityFocuses).where(eq(activityFocuses.code, 'lideranca'));
  return { format: format!.id, focus: focus!.id, secondary: secondary!.id };
}

function planned(externalId: string, ids: Awaited<ReturnType<typeof refIds>>, overrides: Partial<ActivityWrite> = {}, published = false): PlannedActivity {
  const data: ActivityWrite = {
    name: `Atividade ${externalId}`,
    description: 'Descrição',
    materials: 'Nenhum material necessário',
    instructions: null,
    approximate_duration_minutes: 20,
    duration_min_minutes: 15,
    duration_max_minutes: 30,
    external_id: externalId,
    group_sizes: ['medium'],
    effort_level: 'low',
    locations: ['inside'],
    age_groups: ['scouts'],
    format_id: ids.format,
    focus_id: ids.focus,
    secondary_focus_id: ids.secondary,
    ...overrides,
  };
  return { row: 1, externalId, source: null, published, data };
}

describe('reference sheet loaders (DB)', () => {
  beforeAll(async () => {
    requireLocalTestDatabase();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe('formats and focuses', () => {
    it('loads 8 formats and 10 focuses as managed rows, and a second run changes nothing', async () => {
      expect(await applyActivityFormatsAndFocuses(db)).toEqual({ formats: 8, focuses: 10 });
      expect(await applyActivityFormatsAndFocuses(db)).toEqual({ formats: 0, focuses: 0 });
      const formats = await db.select().from(activityFormats);
      const focuses = await db.select().from(activityFocuses);
      expect(formats).toHaveLength(8);
      expect(focuses).toHaveLength(10);
      expect([...formats, ...focuses].every((row) => row.is_managed && row.description)).toBe(true);
      expect(formats.map((f) => f.name)).not.toContain('Serviço');
    });

    it('corrects a changed description on the next load', async () => {
      await applyActivityFormatsAndFocuses(db);
      await db.update(activityFormats).set({ description: 'alterada' }).where(eq(activityFormats.code, 'jogo'));
      expect(await applyActivityFormatsAndFocuses(db)).toEqual({ formats: 1, focuses: 0 });
    });
  });

  describe('sources', () => {
    it('loads the priority from the sheet and is idempotent', async () => {
      await applyActivitySources(db);
      expect(await applyActivitySources(db)).toBe(0);
      const rows = await db.select({ code: activitySources.code, priority: activitySources.priority }).from(activitySources);
      const byCode = new Map(rows.map((r) => [r.code, r.priority]));
      expect(byCode.get('PLAY14')).toBe(1);
      expect(byCode.get('OSM')).toBe(4);
      expect(byCode.get('PESSOAL')).toBeNull();
    });
  });

  describe('desafios', () => {
    it('stores the short title and the integration divisions, and a second run changes nothing', async () => {
      await applyProgressMatrix(db);
      const second = await applyProgressMatrix(db);
      expect(second.changed.challenges).toBe(0);
      const rows = await db.select().from(challenges);
      const by = new Map(rows.map((c) => [c.code, c]));
      expect(by.get('EVAS-B')!.short_title).toBe('Participa em 3 jogos de sentidos e motricidade.');
      expect(by.get('VAL-D')!.integration_age_groups).toEqual(['scouts', 'adventurers', 'rovers']);
      expect(by.get('VAL-G')!.integration_age_groups).toEqual([]);
      expect(rows.filter((c) => c.integration_age_groups.length > 0)).toHaveLength(31);
    });

    it('repairs a changed integration list on the next load', async () => {
      await applyProgressMatrix(db);
      await db.update(challenges).set({ integration_age_groups: [] }).where(eq(challenges.code, 'EVAS-A'));
      expect((await applyProgressMatrix(db)).changed.challenges).toBe(1);
    });
  });

  describe('upsert by sheet id', () => {
    it('creates, then reports unchanged, then updates only an edited row', async () => {
      await applyActivityFormatsAndFocuses(db);
      const ids = await refIds();
      const first = await upsertSelection([planned('ATV-0001', ids), planned('ATV-0002', ids)], { approveAll: false });
      expect(first).toEqual({ created: 2, updated: 0, unchanged: 0 });

      const again = await upsertSelection([planned('ATV-0001', ids), planned('ATV-0002', ids)], { approveAll: false });
      expect(again).toEqual({ created: 0, updated: 0, unchanged: 2 });

      const edited = await upsertSelection([planned('ATV-0001', ids, { description: 'Nova descrição' }), planned('ATV-0002', ids)], { approveAll: false });
      expect(edited).toEqual({ created: 0, updated: 1, unchanged: 1 });
      const rows = await db.select().from(activities).where(eq(activities.external_id, 'ATV-0001'));
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ description: 'Nova descrição', duration_min_minutes: 15, duration_max_minutes: 30, is_approved: false });
      expect(rows[0]!.external_hash).toBe(contentHash(planned('ATV-0001', ids, { description: 'Nova descrição' }).data));
    });

    it('keeps the picture an activity already has when the sheet row changes', async () => {
      await applyActivityFormatsAndFocuses(db);
      const ids = await refIds();
      await upsertSelection([planned('ATV-0001', ids)], { approveAll: false });
      await db.update(activities).set({ image_url: '/activity-illustrations/exemplo.png' }).where(eq(activities.external_id, 'ATV-0001'));

      await upsertSelection([planned('ATV-0001', ids, { description: 'Outra descrição' })], { approveAll: false });

      const [row] = await db.select().from(activities).where(eq(activities.external_id, 'ATV-0001'));
      expect(row).toMatchObject({ description: 'Outra descrição', image_url: '/activity-illustrations/exemplo.png' });
    });

    it('respects Publicada, and --approve-all approves without ever withdrawing an approval', async () => {
      await applyActivityFormatsAndFocuses(db);
      const ids = await refIds();
      await upsertSelection([planned('ATV-0001', ids, {}, true), planned('ATV-0002', ids, {}, false)], { approveAll: false });
      const approvedOf = async (id: string) => (await db.select().from(activities).where(eq(activities.external_id, id)))[0]!.is_approved;
      expect(await approvedOf('ATV-0001')).toBe(true);
      expect(await approvedOf('ATV-0002')).toBe(false);

      const approveAll = await upsertSelection([planned('ATV-0001', ids, {}, false), planned('ATV-0002', ids, {}, false)], { approveAll: true });
      expect(approveAll).toEqual({ created: 0, updated: 1, unchanged: 1 });
      expect(await approvedOf('ATV-0002')).toBe(true);

      await upsertSelection([planned('ATV-0001', ids, {}, false)], { approveAll: false });
      expect(await approvedOf('ATV-0001')).toBe(true); // not withdrawn
    });

    it('never touches an activity made in the app', async () => {
      await applyActivityFormatsAndFocuses(db);
      const ids = await refIds();
      const [own] = await db
        .insert(activities)
        .values({ name: 'Minha', description: 'd', materials: 'm', approximate_duration_minutes: 10, effort_level: 'low' })
        .returning({ id: activities.id });
      await upsertSelection([planned('ATV-0001', ids)], { approveAll: true });
      const [after] = await db.select().from(activities).where(eq(activities.id, own!.id));
      expect(after).toMatchObject({ name: 'Minha', external_id: null, external_hash: null, format_id: null });
    });

    it('writes nothing in a dry run', async () => {
      await applyActivityFormatsAndFocuses(db);
      const ids = await refIds();
      const result = await upsertSelection([planned('ATV-0001', ids)], { approveAll: true, dryRun: true });
      expect(result).toEqual({ created: 1, updated: 0, unchanged: 0 });
      expect(await db.select().from(activities)).toHaveLength(0);
    });
  });
});
