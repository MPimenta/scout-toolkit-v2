import { createHash } from 'node:crypto';
import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import {
  activities,
  activityAgeGroups,
  activityFocuses,
  activityFormats,
  activitySources,
  challenges,
  educationalGoalAgeGroups,
  educationalGoals,
  programEntries,
  sdgs,
} from '../../../drizzle/schema';
import { createActivity, updateActivity, type ActivityWrite } from './write';
import type { PlannedActivity, Taxonomies } from './baseline-plan';

/** Database side of the baseline load. Callers decide which database `db` points at. */

export async function loadTaxonomies(): Promise<Taxonomies> {
  const [formats, focuses, sdgRows, goalRows, ageRows, challengeRows, sources] = await Promise.all([
    db.select({ id: activityFormats.id, name: activityFormats.name, code: activityFormats.code }).from(activityFormats),
    db.select({ id: activityFocuses.id, name: activityFocuses.name, code: activityFocuses.code }).from(activityFocuses),
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
  return { formats, focuses, sdgs: sdgRows, goals, challenges: challengeRows, sources };
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

/** Stable hash of what a snapshot row writes, so an unchanged row can be recognised on the next run. */
export function contentHash(data: ActivityWrite): string {
  const stable = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([key]) => key !== 'external_hash')
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, inner]) => [key, stable(inner)])
      );
    }
    return value;
  };
  return createHash('sha256').update(JSON.stringify(stable(data))).digest('hex');
}

export type UpsertResult = { created: number; updated: number; unchanged: number };

/**
 * Loads rows that carry a sheet id (ATV-0001): creates the missing ones, updates the ones whose content
 * changed and leaves the rest alone. Activities without a sheet id are never touched. An activity is
 * approved when the sheet says Publicada or when `approveAll` is set; an existing approval is never withdrawn.
 */
export async function upsertSelection(
  selected: readonly PlannedActivity[],
  options: { approveAll: boolean; dryRun?: boolean }
): Promise<UpsertResult> {
  const result: UpsertResult = { created: 0, updated: 0, unchanged: 0 };
  const ids = selected.map((item) => item.externalId).filter((id): id is string => Boolean(id));
  const existing = ids.length
    ? await db
        .select({ id: activities.id, external_id: activities.external_id, external_hash: activities.external_hash, is_approved: activities.is_approved })
        .from(activities)
        .where(inArray(activities.external_id, ids))
    : [];
  const byExternalId = new Map(existing.map((row) => [row.external_id!, row]));
  for (const item of selected) {
    if (!item.externalId) continue; // rows without a sheet id go through insertSelection
    const approved = options.approveAll || item.published;
    const data: ActivityWrite = { ...item.data, external_id: item.externalId, external_hash: contentHash(item.data) };
    const current = byExternalId.get(item.externalId);
    if (!current) {
      if (!options.dryRun) await createActivity(data, { isApproved: approved });
      result.created += 1;
      continue;
    }
    const needsApproval = approved && !current.is_approved;
    if (current.external_hash === data.external_hash && !needsApproval) {
      result.unchanged += 1;
      continue;
    }
    if (!options.dryRun) {
      if (current.external_hash !== data.external_hash) await updateActivity(current.id, data);
      if (needsApproval) await db.update(activities).set({ is_approved: true }).where(eq(activities.id, current.id));
    }
    result.updated += 1;
  }
  return result;
}

/**
 * Loads a whole selection: rows with a sheet id are upserted (see `upsertSelection`), the others are
 * inserted as new activities. `loaded` is what changed in the catalogue (created + updated + inserted).
 */
export async function applySelection(
  selected: readonly PlannedActivity[],
  options: { approveAll: boolean; dryRun?: boolean }
): Promise<UpsertResult & { inserted: number; loaded: number }> {
  const upsert = await upsertSelection(selected, options);
  const withoutId = selected.filter((item) => !item.externalId);
  const inserted = options.dryRun ? withoutId.length : await insertSelection(withoutId);
  return { ...upsert, inserted, loaded: upsert.created + upsert.updated + inserted };
}

export async function insertSelection(selected: readonly PlannedActivity[]): Promise<number> {
  let loaded = 0;
  for (const item of selected) {
    await createActivity(item.data, { isApproved: true });
    loaded += 1;
  }
  return loaded;
}
