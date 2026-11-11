import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq, sql as dsql } from 'drizzle-orm';
import { setupTestDatabase, teardownTestDatabase, resetTestDatabase } from '../../setup';
import { db } from '@/lib/db/server';
import {
  activities,
  activityEducationalGoals,
  challengeGoals,
  challengeTypes,
  challenges,
  educationalAreas,
  educationalGoalAgeGroups,
  educationalGoals,
  educationalPaths,
  generalObjectives,
} from '../../../drizzle/schema';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { applyProgressMatrix, PROGRESS_MATRIX } from '@/lib/reference-data/progress-matrix';
import type { ProgressMatrixDataset } from '@/lib/reference-data/progress-matrix-types';

async function count(_table: unknown, name: string): Promise<number> {
  const rows = await db.execute(dsql.raw(`select count(*)::int as n from ${name}`));
  return Number((rows as unknown as Array<{ n: number }>)[0]!.n);
}

async function activityWithGoal(goalCode: string): Promise<string> {
  const [activity] = await db
    .insert(activities)
    .values({ name: 'Atividade de teste', description: 'd', materials: 'm', approximate_duration_minutes: 30, effort_level: 'low' })
    .returning({ id: activities.id });
  const [goal] = await db.select({ id: educationalGoals.id }).from(educationalGoals).where(eq(educationalGoals.code, goalCode));
  await db.insert(activityEducationalGoals).values({ activity_id: activity!.id, goal_id: goal!.id, age_group: 'scouts' });
  return activity!.id;
}

describe('applyProgressMatrix (DB)', () => {
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

  it('loads the whole Matriz into an empty database', async () => {
    const result = await applyProgressMatrix(db);

    expect(await count(educationalAreas, 'educational_areas')).toBe(6);
    expect(await count(educationalPaths, 'educational_paths')).toBe(20);
    expect(await count(generalObjectives, 'general_objectives')).toBe(40);
    expect(await count(educationalGoals, 'educational_goals')).toBe(174);
    expect(await count(educationalGoalAgeGroups, 'educational_goal_age_groups')).toBe(187);
    expect(await count(challengeTypes, 'challenge_types')).toBe(7);
    expect(await count(challenges, 'challenges')).toBe(112);
    expect(await count(challengeGoals, 'challenge_goals')).toBe(287);
    expect(result.changed.goals).toBe(174);

    const shared = await db
      .select({ id: educationalGoals.id })
      .from(educationalGoals)
      .where(eq(educationalGoals.code, '3A.3-4'));
    const ages = await db
      .select({ age: educationalGoalAgeGroups.age_group })
      .from(educationalGoalAgeGroups)
      .where(eq(educationalGoalAgeGroups.goal_id, shared[0]!.id));
    expect(ages.map((a) => a.age).sort()).toEqual(['adventurers', 'rovers']);
  });

  it('changes nothing on a second run', async () => {
    await applyProgressMatrix(db);
    const second = await applyProgressMatrix(db);
    expect(second.changed).toEqual({
      areas: 0,
      paths: 0,
      generalObjectives: 0,
      goals: 0,
      goalAgeGroups: 0,
      challengeTypes: 0,
      challenges: 0,
      challengeGoals: 0,
    });
    expect(second.retired).toEqual({ goals: 0, areas: 0, activityLinks: 0 });
  });

  it('keeps existing activities untouched', async () => {
    await applyProgressMatrix(db);
    const id = await activityWithGoal('1A.2');
    await applyProgressMatrix(db);
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    expect(activity?.name).toBe('Atividade de teste');
    expect(await count(activityEducationalGoals, 'activity_educational_goals')).toBe(1);
  });

  it('retires placeholder goals and keeps admin-created ones', async () => {
    const [area] = await db
      .insert(educationalAreas)
      .values({ name: 'Competências Sociais', icon: 'users', code: 'SOCIAL' })
      .returning({ id: educationalAreas.id });
    await db.insert(educationalGoals).values([
      { area_id: area!.id, title: 'Comunicação', code: 'SOCIAL_COMM' },
      { area_id: area!.id, title: 'Criada por um admin', code: 'ADMIN_CUSTOM' },
    ]);
    const [placeholder] = await db.select({ id: educationalGoals.id }).from(educationalGoals).where(eq(educationalGoals.code, 'SOCIAL_COMM'));
    const [custom] = await db.select({ id: educationalGoals.id }).from(educationalGoals).where(eq(educationalGoals.code, 'ADMIN_CUSTOM'));
    const [activity] = await db
      .insert(activities)
      .values({ name: 'Com placeholders', description: 'd', materials: 'm', approximate_duration_minutes: 10, effort_level: 'low' })
      .returning({ id: activities.id });
    await db.insert(activityEducationalGoals).values([
      { activity_id: activity!.id, goal_id: placeholder!.id, age_group: 'scouts' },
      { activity_id: activity!.id, goal_id: custom!.id, age_group: 'scouts' },
    ]);

    const result = await applyProgressMatrix(db);

    expect(result.retired.goals).toBe(1);
    expect(result.retired.activityLinks).toBe(1);
    expect(await db.select().from(educationalGoals).where(eq(educationalGoals.code, 'SOCIAL_COMM'))).toHaveLength(0);
    expect(await db.select().from(educationalGoals).where(eq(educationalGoals.code, 'ADMIN_CUSTOM'))).toHaveLength(1);
    // The area still holds the admin goal, so it stays.
    expect(await db.select().from(educationalAreas).where(eq(educationalAreas.code, 'SOCIAL'))).toHaveLength(1);
    const links = await db.select().from(activityEducationalGoals).where(eq(activityEducationalGoals.activity_id, activity!.id));
    expect(links.map((l) => l.goal_id)).toEqual([custom!.id]);
    expect(await db.select().from(activities).where(eq(activities.id, activity!.id))).toHaveLength(1);
  });

  it('updates changed text and replaces changed links', async () => {
    await applyProgressMatrix(db);
    const edited: ProgressMatrixDataset = structuredClone(PROGRESS_MATRIX);
    edited.goals[0]!.title = 'Texto revisto';
    edited.challenges[0]!.goal_codes = [edited.goals[1]!.code];
    const result = await applyProgressMatrix(db, edited);

    expect(result.changed.goals).toBe(1);
    expect(result.changed.challengeGoals).toBeGreaterThan(0);
    const [goal] = await db.select().from(educationalGoals).where(eq(educationalGoals.code, edited.goals[0]!.code));
    expect(goal?.title).toBe('Texto revisto');
    const [challenge] = await db.select().from(challenges).where(eq(challenges.code, edited.challenges[0]!.code));
    const links = await db.select().from(challengeGoals).where(eq(challengeGoals.challenge_id, challenge!.id));
    expect(links).toHaveLength(1);
  });

  it('rejects a goal whose area differs from its general objective, writing nothing', async () => {
    const broken: ProgressMatrixDataset = structuredClone(PROGRESS_MATRIX);
    broken.goals[0]!.area_code = broken.goals[0]!.area_code === 'F' ? 'A' : 'F';
    await expect(applyProgressMatrix(db, broken)).rejects.toThrow(/differs from its general objective/);
    expect(await count(educationalAreas, 'educational_areas')).toBe(0);
  });
});
