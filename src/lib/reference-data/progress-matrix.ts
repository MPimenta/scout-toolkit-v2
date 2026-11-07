import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import {
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
import dataset from '../../../drizzle/seeds/data/progress-matrix.json';
import type { ProgressMatrixDataset } from './progress-matrix-types';

/** A drizzle database or transaction (the loader opens its own transaction on a database). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the schema generic differs between callers
export type ReferenceExecutor = PgDatabase<PgQueryResultHKT, any>;

export const PROGRESS_MATRIX = dataset as unknown as ProgressMatrixDataset;

/** Codes the old demo seed created. They are retired when the Matriz is loaded. */
export const PLACEHOLDER_AREA_CODES = ['SOCIAL', 'LEADERSHIP', 'CREATIVITY', 'CITIZENSHIP', 'TECHNICAL'] as const;
export const PLACEHOLDER_GOAL_CODES = [
  'SOCIAL_COMM',
  'SOCIAL_TEAM',
  'SOCIAL_EMPATHY',
  'LEADERSHIP_DECISION',
  'LEADERSHIP_RESPONSIBILITY',
  'LEADERSHIP_MOTIVATION',
  'CREATIVITY_THINKING',
  'CREATIVITY_ART',
  'CREATIVITY_PROBLEM',
  'CITIZENSHIP_ENVIRONMENT',
  'CITIZENSHIP_PARTICIPATION',
  'CITIZENSHIP_RIGHTS',
  'TECHNICAL_FIRST_AID',
  'TECHNICAL_KNOTS',
  'TECHNICAL_ORIENTEERING',
] as const;

export interface ApplyProgressMatrixResult {
  /** Rows inserted or updated, per table. A second run on unchanged data reports all zeros. */
  changed: {
    areas: number;
    paths: number;
    generalObjectives: number;
    goals: number;
    goalAgeGroups: number;
    challengeTypes: number;
    challenges: number;
    challengeGoals: number;
  };
  retired: {
    goals: number;
    areas: number;
    /** Activity-to-goal links removed together with the retired and stale goals. */
    activityLinks: number;
  };
  /** Managed rows that are no longer in the dataset and were removed. */
  removedStale: { challenges: number; challengeTypes: number; goals: number; generalObjectives: number; paths: number; areas: number };
}

type Tx = ReferenceExecutor;

function pairKey(a: string, b: string): string {
  return `${a}\u0000${b}`;
}

/** Fails before any write when the dataset is internally inconsistent. */
export function assertDatasetConsistent(data: ProgressMatrixDataset): void {
  const areaCodes = new Set(data.areas.map((a) => a.code));
  const pathAreas = new Map(data.paths.map((p) => [p.code, p.area_code]));
  const generalAreas = new Map(data.general_objectives.map((g) => [g.code, g.area_code]));
  for (const path of data.paths) {
    if (!areaCodes.has(path.area_code)) throw new Error(`Path ${path.code} has unknown area ${path.area_code}`);
  }
  for (const general of data.general_objectives) {
    if (pathAreas.get(general.path_code) !== general.area_code) {
      throw new Error(`General objective ${general.code} is in a path of another area`);
    }
  }
  for (const goal of data.goals) {
    if (generalAreas.get(goal.general_objective_code) !== goal.area_code) {
      throw new Error(`Objective ${goal.code} has an area that differs from its general objective ${goal.general_objective_code}`);
    }
    if (goal.age_groups.length === 0) throw new Error(`Objective ${goal.code} has no age group`);
  }
}

/**
 * Loads the Matriz Progresso Pessoal reference data. Idempotent: rows are upserted by
 * `code`, only rows whose values differ are written, and only rows this loader owns
 * (`is_managed`) are ever updated or removed. Admin-created rows are left alone.
 */
export async function applyProgressMatrix(
  database: ReferenceExecutor,
  data: ProgressMatrixDataset = PROGRESS_MATRIX
): Promise<ApplyProgressMatrixResult> {
  assertDatasetConsistent(data);
  return (database as PgDatabase<PgQueryResultHKT, Record<string, never>>).transaction((tx) => run(tx, data));
}

async function run(tx: Tx, data: ProgressMatrixDataset): Promise<ApplyProgressMatrixResult> {
  const result: ApplyProgressMatrixResult = {
    changed: {
      areas: 0,
      paths: 0,
      generalObjectives: 0,
      goals: 0,
      goalAgeGroups: 0,
      challengeTypes: 0,
      challenges: 0,
      challengeGoals: 0,
    },
    retired: { goals: 0, areas: 0, activityLinks: 0 },
    removedStale: { challenges: 0, challengeTypes: 0, goals: 0, generalObjectives: 0, paths: 0, areas: 0 },
  };

  // 1. Areas
  const areaIds = new Map<string, string>();
  for (const area of data.areas) {
    const rows = await tx
      .insert(educationalAreas)
      .values({ code: area.code, name: area.name, icon: area.icon, position: area.position, is_managed: true })
      .onConflictDoUpdate({
        target: educationalAreas.code,
        set: { name: area.name, icon: area.icon, position: area.position, is_managed: true },
        setWhere: sql`(${educationalAreas.name}, ${educationalAreas.icon}, ${educationalAreas.position}, ${educationalAreas.is_managed}) IS DISTINCT FROM (${area.name}, ${area.icon}, ${area.position}, true)`,
      })
      .returning({ id: educationalAreas.id });
    result.changed.areas += rows.length;
  }
  for (const row of await tx.select({ id: educationalAreas.id, code: educationalAreas.code }).from(educationalAreas)) {
    areaIds.set(row.code, row.id);
  }

  // 2. Paths
  for (const path of data.paths) {
    const areaId = areaIds.get(path.area_code)!;
    const rows = await tx
      .insert(educationalPaths)
      .values({ code: path.code, area_id: areaId, name: path.name, position: path.position, is_managed: true })
      .onConflictDoUpdate({
        target: educationalPaths.code,
        set: { area_id: areaId, name: path.name, position: path.position, is_managed: true },
        setWhere: sql`(${educationalPaths.area_id}, ${educationalPaths.name}, ${educationalPaths.position}, ${educationalPaths.is_managed}) IS DISTINCT FROM (${areaId}::uuid, ${path.name}, ${path.position}, true)`,
      })
      .returning({ id: educationalPaths.id });
    result.changed.paths += rows.length;
  }
  const pathIds = new Map(
    (await tx.select({ id: educationalPaths.id, code: educationalPaths.code }).from(educationalPaths)).map((r) => [r.code, r.id])
  );

  // 3. General objectives
  for (const general of data.general_objectives) {
    const areaId = areaIds.get(general.area_code)!;
    const pathId = pathIds.get(general.path_code)!;
    const rows = await tx
      .insert(generalObjectives)
      .values({ code: general.code, area_id: areaId, path_id: pathId, title: general.title, position: general.position, is_managed: true })
      .onConflictDoUpdate({
        target: generalObjectives.code,
        set: { area_id: areaId, path_id: pathId, title: general.title, position: general.position, is_managed: true },
        setWhere: sql`(${generalObjectives.area_id}, ${generalObjectives.path_id}, ${generalObjectives.title}, ${generalObjectives.position}, ${generalObjectives.is_managed}) IS DISTINCT FROM (${areaId}::uuid, ${pathId}::uuid, ${general.title}, ${general.position}, true)`,
      })
      .returning({ id: generalObjectives.id });
    result.changed.generalObjectives += rows.length;
  }
  const generalIds = new Map(
    (await tx.select({ id: generalObjectives.id, code: generalObjectives.code }).from(generalObjectives)).map((r) => [r.code, r.id])
  );

  // 4. Goals (specific objectives) and their age groups
  for (const goal of data.goals) {
    const areaId = areaIds.get(goal.area_code)!;
    const generalId = generalIds.get(goal.general_objective_code)!;
    const rows = await tx
      .insert(educationalGoals)
      .values({
        code: goal.code,
        area_id: areaId,
        general_objective_id: generalId,
        title: goal.title,
        position: goal.position,
        is_managed: true,
      })
      .onConflictDoUpdate({
        target: educationalGoals.code,
        set: { area_id: areaId, general_objective_id: generalId, title: goal.title, position: goal.position, is_managed: true },
        setWhere: sql`(${educationalGoals.area_id}, ${educationalGoals.general_objective_id}, ${educationalGoals.title}, ${educationalGoals.position}, ${educationalGoals.is_managed}) IS DISTINCT FROM (${areaId}::uuid, ${generalId}::uuid, ${goal.title}, ${goal.position}, true)`,
      })
      .returning({ id: educationalGoals.id });
    result.changed.goals += rows.length;
  }
  const goalIds = new Map(
    (await tx.select({ id: educationalGoals.id, code: educationalGoals.code }).from(educationalGoals)).map((r) => [r.code, r.id])
  );

  const wantedAgeLinks = new Set<string>();
  for (const goal of data.goals) for (const ageGroup of goal.age_groups) wantedAgeLinks.add(pairKey(goalIds.get(goal.code)!, ageGroup));
  const managedGoalIds = data.goals.map((g) => goalIds.get(g.code)!);
  const existingAgeLinks = await tx
    .select()
    .from(educationalGoalAgeGroups)
    .where(inArray(educationalGoalAgeGroups.goal_id, managedGoalIds));
  const existingAgeKeys = new Set(existingAgeLinks.map((l) => pairKey(l.goal_id, l.age_group)));
  for (const link of existingAgeLinks) {
    if (!wantedAgeLinks.has(pairKey(link.goal_id, link.age_group))) {
      await tx
        .delete(educationalGoalAgeGroups)
        .where(and(eq(educationalGoalAgeGroups.goal_id, link.goal_id), eq(educationalGoalAgeGroups.age_group, link.age_group)));
      result.changed.goalAgeGroups++;
    }
  }
  const newAgeLinks = data.goals.flatMap((goal) =>
    goal.age_groups
      .filter((ageGroup) => !existingAgeKeys.has(pairKey(goalIds.get(goal.code)!, ageGroup)))
      .map((ageGroup) => ({ goal_id: goalIds.get(goal.code)!, age_group: ageGroup }))
  );
  if (newAgeLinks.length > 0) {
    await tx.insert(educationalGoalAgeGroups).values(newAgeLinks);
    result.changed.goalAgeGroups += newAgeLinks.length;
  }

  // 5. Challenge types, challenges and their links
  for (const type of data.challenge_types) {
    const rows = await tx
      .insert(challengeTypes)
      .values({ code: type.code, name: type.name, position: type.position, is_managed: true })
      .onConflictDoUpdate({
        target: challengeTypes.code,
        set: { name: type.name, position: type.position, is_managed: true },
        setWhere: sql`(${challengeTypes.name}, ${challengeTypes.position}, ${challengeTypes.is_managed}) IS DISTINCT FROM (${type.name}, ${type.position}, true)`,
      })
      .returning({ id: challengeTypes.id });
    result.changed.challengeTypes += rows.length;
  }
  const typeIds = new Map(
    (await tx.select({ id: challengeTypes.id, code: challengeTypes.code }).from(challengeTypes)).map((r) => [r.code, r.id])
  );

  for (const challenge of data.challenges) {
    const typeId = typeIds.get(challenge.type_code)!;
    const rows = await tx
      .insert(challenges)
      .values({
        code: challenge.code,
        type_id: typeId,
        age_group: challenge.age_group,
        position: challenge.position,
        title: challenge.title,
        is_managed: true,
      })
      .onConflictDoUpdate({
        target: challenges.code,
        set: { type_id: typeId, age_group: challenge.age_group, position: challenge.position, title: challenge.title, is_managed: true },
        setWhere: sql`(${challenges.type_id}, ${challenges.age_group}, ${challenges.position}, ${challenges.title}, ${challenges.is_managed}) IS DISTINCT FROM (${typeId}::uuid, ${challenge.age_group}, ${challenge.position}, ${challenge.title}, true)`,
      })
      .returning({ id: challenges.id });
    result.changed.challenges += rows.length;
  }
  const challengeIds = new Map(
    (await tx.select({ id: challenges.id, code: challenges.code }).from(challenges)).map((r) => [r.code, r.id])
  );

  const wantedChallengeLinks = new Set<string>();
  for (const challenge of data.challenges) {
    for (const code of challenge.goal_codes) wantedChallengeLinks.add(pairKey(challengeIds.get(challenge.code)!, goalIds.get(code)!));
  }
  const dataChallengeIds = data.challenges.map((c) => challengeIds.get(c.code)!);
  const existingChallengeLinks = await tx
    .select()
    .from(challengeGoals)
    .where(inArray(challengeGoals.challenge_id, dataChallengeIds));
  const existingChallengeKeys = new Set(existingChallengeLinks.map((l) => pairKey(l.challenge_id, l.goal_id)));
  for (const link of existingChallengeLinks) {
    if (!wantedChallengeLinks.has(pairKey(link.challenge_id, link.goal_id))) {
      await tx
        .delete(challengeGoals)
        .where(and(eq(challengeGoals.challenge_id, link.challenge_id), eq(challengeGoals.goal_id, link.goal_id)));
      result.changed.challengeGoals++;
    }
  }
  const newChallengeLinks = data.challenges.flatMap((challenge) =>
    challenge.goal_codes
      .map((code) => ({ challenge_id: challengeIds.get(challenge.code)!, goal_id: goalIds.get(code)! }))
      .filter((link) => !existingChallengeKeys.has(pairKey(link.challenge_id, link.goal_id)))
  );
  if (newChallengeLinks.length > 0) {
    await tx.insert(challengeGoals).values(newChallengeLinks);
    result.changed.challengeGoals += newChallengeLinks.length;
  }

  // 6. Retire the placeholder goals and areas of the old demo seed
  const placeholderGoals = await tx
    .select({ id: educationalGoals.id })
    .from(educationalGoals)
    .where(and(inArray(educationalGoals.code, [...PLACEHOLDER_GOAL_CODES]), eq(educationalGoals.is_managed, false)));
  if (placeholderGoals.length > 0) {
    const ids = placeholderGoals.map((g) => g.id);
    const links = await tx.select().from(activityEducationalGoals).where(inArray(activityEducationalGoals.goal_id, ids));
    result.retired.activityLinks += links.length;
    await tx.delete(educationalGoals).where(inArray(educationalGoals.id, ids));
    result.retired.goals = ids.length;
  }
  // Delete a placeholder area only when nothing (for example an admin goal) still hangs from it.
  const placeholderAreas = await tx
    .select({ id: educationalAreas.id })
    .from(educationalAreas)
    .where(and(inArray(educationalAreas.code, [...PLACEHOLDER_AREA_CODES]), eq(educationalAreas.is_managed, false)));
  for (const area of placeholderAreas) {
    const remaining = await tx.select({ id: educationalGoals.id }).from(educationalGoals).where(eq(educationalGoals.area_id, area.id)).limit(1);
    if (remaining.length === 0) {
      await tx.delete(educationalAreas).where(eq(educationalAreas.id, area.id));
      result.retired.areas++;
    }
  }

  // 7. Remove managed rows that left the dataset (children first)
  await removeStale(tx, data, result);
  return result;
}

async function removeStale(tx: Tx, data: ProgressMatrixDataset, result: ApplyProgressMatrixResult): Promise<void> {
  const challengeCodes = data.challenges.map((c) => c.code);
  const typeCodes = data.challenge_types.map((t) => t.code);
  const goalCodes = data.goals.map((g) => g.code);
  const generalCodes = data.general_objectives.map((g) => g.code);
  const pathCodes = data.paths.map((p) => p.code);
  const areaCodes = data.areas.map((a) => a.code);

  result.removedStale.challenges = (
    await tx.delete(challenges).where(and(eq(challenges.is_managed, true), notInArray(challenges.code, challengeCodes))).returning({ id: challenges.id })
  ).length;
  result.removedStale.challengeTypes = (
    await tx.delete(challengeTypes).where(and(eq(challengeTypes.is_managed, true), notInArray(challengeTypes.code, typeCodes))).returning({ id: challengeTypes.id })
  ).length;

  const staleGoals = await tx
    .select({ id: educationalGoals.id })
    .from(educationalGoals)
    .where(and(eq(educationalGoals.is_managed, true), notInArray(educationalGoals.code, goalCodes)));
  if (staleGoals.length > 0) {
    const ids = staleGoals.map((g) => g.id);
    const links = await tx.select().from(activityEducationalGoals).where(inArray(activityEducationalGoals.goal_id, ids));
    result.retired.activityLinks += links.length;
    await tx.delete(educationalGoals).where(inArray(educationalGoals.id, ids));
    result.removedStale.goals = ids.length;
  }
  result.removedStale.generalObjectives = (
    await tx.delete(generalObjectives).where(and(eq(generalObjectives.is_managed, true), notInArray(generalObjectives.code, generalCodes))).returning({ id: generalObjectives.id })
  ).length;
  result.removedStale.paths = (
    await tx.delete(educationalPaths).where(and(eq(educationalPaths.is_managed, true), notInArray(educationalPaths.code, pathCodes))).returning({ id: educationalPaths.id })
  ).length;
  result.removedStale.areas = (
    await tx.delete(educationalAreas).where(and(eq(educationalAreas.is_managed, true), notInArray(educationalAreas.code, areaCodes))).returning({ id: educationalAreas.id })
  ).length;
}
