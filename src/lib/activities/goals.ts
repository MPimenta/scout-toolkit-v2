import { inArray } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { educationalGoalAgeGroups } from '../../../drizzle/schema';
import type { AgeGroupValue } from './category-values';

/** Age groups per goal id, for embedding goals with their age groups in activity payloads. */
export async function loadGoalAgeGroups(goalIds: string[]): Promise<Map<string, AgeGroupValue[]>> {
  const unique = [...new Set(goalIds)];
  const map = new Map<string, AgeGroupValue[]>();
  if (unique.length === 0) return map;
  const rows = await db
    .select({ goal_id: educationalGoalAgeGroups.goal_id, age_group: educationalGoalAgeGroups.age_group })
    .from(educationalGoalAgeGroups)
    .where(inArray(educationalGoalAgeGroups.goal_id, unique));
  for (const row of rows) map.set(row.goal_id, [...(map.get(row.goal_id) ?? []), row.age_group]);
  return map;
}
