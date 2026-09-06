import { db } from '@/lib/db/server';
import {
  programs,
  programEntries,
  activities,
  activityTypes,
  user,
  educationalGoals,
  sdgs,
  activityEducationalGoals,
  activitySdgs,
} from '../../../drizzle/schema';
import { eq, asc, inArray } from 'drizzle-orm';
import type { ProgramExportEntry, ProgramForExport } from './types';

export { canAccessProgramExport } from './access';

/**
 * Loads a program with entries, activity details, educational goals, and SDGs
 * for Excel/PDF export. Returns null when the program does not exist.
 */
export async function loadProgramForExport(programId: string): Promise<ProgramForExport | null> {
  const [programData] = await db
    .select({
      id: programs.id,
      name: programs.name,
      date: programs.date,
      start_time: programs.start_time,
      is_public: programs.is_public,
      user_id: programs.user_id,
      created_at: programs.created_at,
      updated_at: programs.updated_at,
      user_name: user.name,
    })
    .from(programs)
    .leftJoin(user, eq(programs.user_id, user.id))
    .where(eq(programs.id, programId));

  if (!programData) {
    return null;
  }

  const entries = await db
    .select({
      id: programEntries.id,
      position: programEntries.position,
      start_time: programEntries.start_time,
      end_time: programEntries.end_time,
      entry_type: programEntries.entry_type,
      custom_title: programEntries.custom_title,
      custom_duration_minutes: programEntries.custom_duration_minutes,
      activity_id: activities.id,
      activity_name: activities.name,
      activity_description: activities.description,
      activity_materials: activities.materials,
      activity_duration: activities.approximate_duration_minutes,
      activity_group_size: activities.group_size,
      activity_effort_level: activities.effort_level,
      activity_location: activities.location,
      activity_type_name: activityTypes.name,
    })
    .from(programEntries)
    .leftJoin(activities, eq(programEntries.activity_id, activities.id))
    .leftJoin(activityTypes, eq(activities.activity_type_id, activityTypes.id))
    .where(eq(programEntries.program_id, programId))
    .orderBy(asc(programEntries.position));

  const activityIds = entries
    .map((entry) => entry.activity_id)
    .filter((id): id is string => Boolean(id));

  const goalsByActivity = new Map<string, Array<{ title: string; code: string }>>();
  const sdgsByActivity = new Map<string, Array<{ number: number; name: string }>>();

  if (activityIds.length > 0) {
    const goalRows = await db
      .select({
        activity_id: activityEducationalGoals.activity_id,
        title: educationalGoals.title,
        code: educationalGoals.code,
      })
      .from(activityEducationalGoals)
      .leftJoin(educationalGoals, eq(activityEducationalGoals.goal_id, educationalGoals.id))
      .where(inArray(activityEducationalGoals.activity_id, activityIds));

    for (const row of goalRows) {
      if (!row.title) continue;
      const list = goalsByActivity.get(row.activity_id) ?? [];
      list.push({ title: row.title, code: row.code ?? '' });
      goalsByActivity.set(row.activity_id, list);
    }

    const sdgRows = await db
      .select({
        activity_id: activitySdgs.activity_id,
        number: sdgs.number,
        name: sdgs.name,
      })
      .from(activitySdgs)
      .leftJoin(sdgs, eq(activitySdgs.sdg_id, sdgs.id))
      .where(inArray(activitySdgs.activity_id, activityIds));

    for (const row of sdgRows) {
      if (row.number == null || !row.name) continue;
      const list = sdgsByActivity.get(row.activity_id) ?? [];
      list.push({ number: row.number, name: row.name });
      sdgsByActivity.set(row.activity_id, list);
    }
  }

  const mappedEntries: ProgramExportEntry[] = entries.map((entry) => ({
    id: entry.id,
    position: entry.position,
    start_time: entry.start_time,
    end_time: entry.end_time,
    entry_type: entry.entry_type,
    custom_title: entry.custom_title,
    custom_duration_minutes: entry.custom_duration_minutes,
    activity: entry.activity_id
      ? {
          id: entry.activity_id,
          name: entry.activity_name,
          description: entry.activity_description,
          materials: entry.activity_materials,
          approximate_duration_minutes: entry.activity_duration,
          group_size: entry.activity_group_size,
          effort_level: entry.activity_effort_level,
          location: entry.activity_location,
          activityType: { name: entry.activity_type_name },
          educationalGoals: goalsByActivity.get(entry.activity_id) ?? [],
          sdgs: sdgsByActivity.get(entry.activity_id) ?? [],
        }
      : null,
  }));

  return {
    id: programData.id,
    name: programData.name,
    date: programData.date,
    start_time: programData.start_time,
    is_public: programData.is_public,
    user_id: programData.user_id,
    created_at: programData.created_at,
    updated_at: programData.updated_at,
    user: { name: programData.user_name },
    entries: mappedEntries,
  };
}
