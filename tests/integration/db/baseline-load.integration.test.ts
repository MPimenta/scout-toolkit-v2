import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { setupTestDatabase, teardownTestDatabase, resetTestDatabase } from '../../setup';
import { db } from '@/lib/db/server';
import { activities, activityTypes, sdgs } from '../../../drizzle/schema';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { planBaselineLoad, type SheetRow } from '@/lib/activities/baseline-plan';
import {
  deleteAllActivities,
  insertSelection,
  loadExistingActivities,
  loadTaxonomies,
} from '@/lib/activities/baseline-db';
import { loadActivityCategories } from '@/lib/activities/categories';

// Synthetic sample (tests/fixtures/baseline-sample.csv): no real sheet content is committed.
function readFixture() {
  const workbook = XLSX.read(readFileSync(path.join(process.cwd(), 'tests', 'fixtures', 'baseline-sample.csv'), 'utf8'), { type: 'string', raw: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]!]!;
  const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: '', raw: false });
  const headers = (XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })[0] ?? []).map(String);
  return { headers, rows };
}

describe('Baseline load (DB)', () => {
  beforeAll(async () => {
    requireLocalTestDatabase();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    await db.insert(activityTypes).values([
      { name: 'Jogo' },
      { name: 'Técnica' },
      { name: 'Expressão' },
    ]);
    await db.insert(sdgs).values([
      { number: 4, name: 'Educação de Qualidade', description: 'd', icon_url: '/4.png' },
      { number: 13, name: 'Ação Climática', description: 'd', icon_url: '/13.png' },
    ]);
  });

  async function runLoad() {
    const { headers, rows } = readFixture();
    const plan = planBaselineLoad(headers, rows, await loadTaxonomies(), {
      limit: 200,
      seed: 1,
      existing: await loadExistingActivities(),
    });
    const loaded = await insertSelection(plan.selected);
    return { plan, loaded };
  }

  it('loads valid rows with normalised values and lists, and reports what it skipped', async () => {
    const { plan, loaded } = await runLoad();
    expect(loaded).toBe(3);
    expect(plan.report.rowsRead).toBe(7); // the blank spacer row is not counted
    expect(plan.report.skipped.map((s) => s.reason).sort()).toEqual([
      'duplicada (mesmo nome e secção)',
      'grupo em falta ou não reconhecido',
      'linha de exemplo',
      'tipo em falta ou não reconhecido',
    ]);

    const rows = await db.select().from(activities);
    const treasure = rows.find((row) => row.name === 'Caça ao Tesouro de Teste')!;
    expect(treasure.approximate_duration_minutes).toBe(30);
    expect(treasure.instructions).toBe('1. Esconder pistas');
    expect(treasure.is_approved).toBe(true);

    const categories = (await loadActivityCategories(rows.map((r) => r.id)));
    const t = categories.get(treasure.id)!;
    expect(t.group_sizes).toEqual(['medium', 'large']);
    expect(t.locations).toEqual(['inside', 'outside']);
    expect(t.age_groups).toEqual(['cub_scouts', 'adventurers']);

    const knots = rows.find((row) => row.name === 'Nós e Amarras de Teste')!;
    expect(knots.approximate_duration_minutes).toBe(60);
    expect(knots.materials).toBe('Nenhum material necessário');
    expect(knots.instructions).toBeNull();
    const song = rows.find((row) => row.name === 'Canção em Roda de Teste')!;
    expect(song.approximate_duration_minutes).toBe(30);
  });

  it('does not load the same activities twice', async () => {
    await runLoad();
    const second = await runLoad();
    expect(second.loaded).toBe(0);
    expect(second.plan.report.skipped.filter((s) => s.reason.startsWith('duplicada')).length).toBeGreaterThanOrEqual(3);
    expect(await db.select().from(activities)).toHaveLength(3);
  });

  it('replaces the catalogue when asked', async () => {
    await runLoad();
    expect(await deleteAllActivities()).toBe(3);
    expect(await db.select().from(activities).where(eq(activities.name, 'Caça ao Tesouro de Teste'))).toHaveLength(0);
    const again = await runLoad();
    expect(again.loaded).toBe(3);
  });
});
