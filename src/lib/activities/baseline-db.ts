import { inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import {
  activities,
  activityAgeGroups,
  activityTypes,
  activitySources,
  challenges,
  educationalGoalAgeGroups,
  educationalGoals,
  programEntries,
  sdgs,
} from '../../../drizzle/schema';
import { createActivity } from './write';
import type { PlannedActivity, Taxonomies } from './baseline-plan';

/** Database side of the baseline load. Callers decide which database `db` points at. */

export async function loadTaxonomies(): Promise<Taxonomies> {
  const [types, sdgRows, goalRows, ageRows, challengeRows, sources] = await Promise.all([
    db.select({ id: activityTypes.id, name: activityTypes.name }).from(activityTypes),
    db.select({ id: sdgs.id, number: sdgs.number, name: sdgs.name }).from(sdgs),
    db.select({ id: educationalGoals.id, code: educationalGoals.code }).from(educationalGoals),
    db.select().from(educationalGoalAgeGroups),
    db.select({ id: challenges.id, code: challenges.code }).from(challenges),
    db.select({ id: activitySources.id, code: activitySources.code, name: activitySources.name }).from(activitySources),
  ]);
  const goals = goalRows.map((goal) => ({
    ...goal,
    age_groups: ageRows.filter((row) => row.goal_id === goal.id).map((row) => row.age_group),
  }));
  return { types, sdgs: sdgRows, goals, challenges: challengeRows, sources };
}

export async function loadExistingActivities(): Promise<Array<{ name: string; age_groups: string[] }>> {
  const rows = await db.select({ id: activities.id, name: activities.name }).from(activities);
  if (rows.length === 0) return [];
  const links = await db
    .select()
    .from(activityAgeGroups)
    .where(inArray(activityAgeGroups.activity_id, rows.map((row) => row.id)));
  const byActivity = new Map<string, string[]>();
  for (const link of links) {
    byActivity.set(link.activity_id, [...(byActivity.get(link.activity_id) ?? []), link.age_group]);
  }
  return rows.map((row) => ({ name: row.name, age_groups: byActivity.get(row.id) ?? [] }));
}

/** Activities that program entries still point at (deleting them nulls those entries). */
export async function findReferencedActivities(): Promise<Array<{ id: string; name: string }>> {
  return db
    .selectDistinct({ id: activities.id, name: activities.name })
    .from(activities)
    .innerJoin(programEntries, sql`${programEntries.activity_id} = ${activities.id}`);
}

export async function deleteAllActivities(): Promise<number> {
  const removed = await db.delete(activities).returning({ id: activities.id });
  return removed.length;
}

export async function insertSelection(selected: readonly PlannedActivity[]): Promise<number> {
  let loaded = 0;
  for (const item of selected) {
    await createActivity(item.data, { isApproved: true });
    loaded += 1;
  }
  return loaded;
}
