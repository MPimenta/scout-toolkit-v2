import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';
import { setupTestDatabase, teardownTestDatabase, resetTestDatabase } from '../../setup';
import { db } from '@/lib/db/server';
import { educationalAreas, educationalGoals } from '../../../drizzle/schema';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { applyProgressMatrix } from '@/lib/reference-data/progress-matrix';
import { verifyActivityGoals, type ActivityWrite } from '@/lib/activities/write';
import type { AgeGroupValue } from '../../../drizzle/schema/category-values';

async function idsFor(...codes: string[]): Promise<string[]> {
  const rows = await db
    .select({ id: educationalGoals.id, code: educationalGoals.code })
    .from(educationalGoals)
    .where(inArray(educationalGoals.code, codes));
  return codes.map((code) => rows.find((row) => row.code === code)!.id);
}

function write(ageGroups: AgeGroupValue[], goalIds: string[]): ActivityWrite {
  return {
    name: 'x',
    description: 'x',
    materials: 'x',
    instructions: null,
    approximate_duration_minutes: 10,
    group_sizes: ['small'],
    effort_level: 'low',
    locations: ['inside'],
    age_groups: ageGroups,
    // verifyActivityGoals does not look at them, so any ids do
    format_id: '6f1c2d4e-0a1b-4c3d-8e5f-0123456789ab',
    focus_id: '7a2d3e5f-1b2c-4d4e-9f60-123456789abc',
    activity_type_ids: [],
    educational_goal_ids: goalIds,
  };
}

describe('verifyActivityGoals (DB)', () => {
  beforeAll(async () => {
    requireLocalTestDatabase();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    await applyProgressMatrix(db);
  });

  it('accepts an objective of the activity age group', async () => {
    expect(await verifyActivityGoals(write(['scouts'], await idsFor('1A.2')))).toBeNull();
  });

  it('rejects an objective of another age group and names its code', async () => {
    const error = await verifyActivityGoals(write(['scouts'], await idsFor('1A.1')));
    expect(error).toContain('1A.1');
  });

  it('accepts several objectives across several age groups, including a shared one', async () => {
    const goals = await idsFor('1A.2', '1A.3', '3A.3-4');
    expect(await verifyActivityGoals(write(['scouts', 'adventurers'], goals))).toBeNull();
  });

  it('rejects when an age group is dropped while its objective stays linked', async () => {
    const error = await verifyActivityGoals(write(['scouts'], await idsFor('1A.2', '1A.3')));
    expect(error).toContain('1A.3');
    expect(error).not.toContain('1A.2');
  });

  it('accepts a shared objective for either of its two age groups', async () => {
    const goals = await idsFor('3A.3-4');
    expect(await verifyActivityGoals(write(['rovers'], goals))).toBeNull();
    expect(await verifyActivityGoals(write(['adventurers'], goals))).toBeNull();
    expect(await verifyActivityGoals(write(['cub_scouts'], goals))).toContain('3A.3-4');
  });

  it('rejects unknown ids and legacy goals that have no age groups', async () => {
    expect(
      await verifyActivityGoals(write(['scouts'], ['00000000-0000-4000-8000-000000000000']))
    ).toBe('Objetivo educativo inválido');

    const [area] = await db.select({ id: educationalAreas.id }).from(educationalAreas).limit(1);
    const [legacy] = await db
      .insert(educationalGoals)
      .values({ area_id: area!.id, title: 'Antigo', code: 'LEGACY_1' })
      .returning({ id: educationalGoals.id });
    expect(await verifyActivityGoals(write(['scouts'], [legacy!.id]))).toContain('LEGACY_1');
  });

  it('accepts an empty list', async () => {
    expect(await verifyActivityGoals(write(['scouts'], []))).toBeNull();
  });
});
