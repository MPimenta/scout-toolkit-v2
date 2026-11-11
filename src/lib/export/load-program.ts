import { db } from '@/lib/db/server';
import {
  programs,
  programEntries,
  activities,
  user,
  educationalGoals,
  sdgs,
  activityEducationalGoals,
  activitySdgs,
  activityChallenges,
  activitySources,
  challenges,
} from '../../../drizzle/schema';
import { eq, asc, inArray } from 'drizzle-orm';
import type { ProgramExportEntry, ProgramExportObjective, ProgramForExport } from './types';
import { computeSchedule } from '@/lib/programs/schedule';
import { loadActivityCategories } from '@/lib/activities/categories';
import { loadFormatFocus } from '@/lib/activities/format-focus';

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
      activity_instructions: activities.instructions,
      activity_duration: activities.approximate_duration_minutes,
      activity_effort_level: activities.effort_level,
      activity_format_id: activities.format_id,
      activity_focus_id: activities.focus_id,
      activity_secondary_focus_id: activities.secondary_focus_id,
      activity_physical_risk_level: activities.physical_risk_level,
      activity_physical_risk: activities.physical_risk,
      activity_physical_mitigation: activities.physical_mitigation,
      activity_psychological_risk_level: activities.psychological_risk_level,
      activity_psychological_risk: activities.psychological_risk,
      activity_psychological_mitigation: activities.psychological_mitigation,
      activity_source_id: activities.source_id,
      activity_source_url: activities.source_url,
    })
    .from(programEntries)
    .leftJoin(activities, eq(programEntries.activity_id, activities.id))
    .where(eq(programEntries.program_id, programId))
    .orderBy(asc(programEntries.position));

  const activityIds = entries
    .map((entry) => entry.activity_id)
    .filter((id): id is string => Boolean(id));

  const categoriesByActivity = await loadActivityCategories(activityIds);
  const formatFocusByActivity = await loadFormatFocus(
    entries
      .filter((entry) => entry.activity_id)
      .map((entry) => ({
        id: entry.activity_id as string,
        format_id: entry.activity_format_id,
        focus_id: entry.activity_focus_id,
        secondary_focus_id: entry.activity_secondary_focus_id,
      }))
  );

  const goalsByActivity = new Map<string, Array<{ title: string; code: string }>>();
  const sdgsByActivity = new Map<string, Array<{ number: number; name: string; justification: string | null }>>();
  const objectivesByActivity = new Map<string, ProgramExportObjective[]>();
  const challengesByActivity = new Map<string, Array<{ code: string; title: string }>>();
  const sourcesById = new Map<string, { name: string; url: string | null; license: string | null }>();

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

    const objectiveRows = await db
      .select({
        activity_id: activityEducationalGoals.activity_id,
        code: educationalGoals.code,
        title: educationalGoals.title,
        age_group: activityEducationalGoals.age_group,
        behaviour: activityEducationalGoals.observable_behaviour,
      })
      .from(activityEducationalGoals)
      .innerJoin(educationalGoals, eq(activityEducationalGoals.goal_id, educationalGoals.id))
      .where(inArray(activityEducationalGoals.activity_id, activityIds))
      .orderBy(asc(educationalGoals.code));
    for (const row of objectiveRows) {
      const list = objectivesByActivity.get(row.activity_id) ?? [];
      list.push({ code: row.code, title: row.title, age_group: row.age_group, behaviour: row.behaviour });
      objectivesByActivity.set(row.activity_id, list);
    }

    const challengeRows = await db
      .select({ activity_id: activityChallenges.activity_id, code: challenges.code, title: challenges.title })
      .from(activityChallenges)
      .innerJoin(challenges, eq(activityChallenges.challenge_id, challenges.id))
      .where(inArray(activityChallenges.activity_id, activityIds))
      .orderBy(asc(challenges.code));
    for (const row of challengeRows) {
      const list = challengesByActivity.get(row.activity_id) ?? [];
      list.push({ code: row.code, title: row.title });
      challengesByActivity.set(row.activity_id, list);
    }

    const sourceIds = [...new Set(entries.map((entry) => entry.activity_source_id).filter((id): id is string => Boolean(id)))];
    if (sourceIds.length > 0) {
      for (const source of await db.select().from(activitySources).where(inArray(activitySources.id, sourceIds))) {
        sourcesById.set(source.id, { name: source.name, url: source.url, license: source.license });
      }
    }

    const sdgRows = await db
      .select({
        activity_id: activitySdgs.activity_id,
        number: sdgs.number,
        name: sdgs.name,
        justification: activitySdgs.justification,
      })
      .from(activitySdgs)
      .leftJoin(sdgs, eq(activitySdgs.sdg_id, sdgs.id))
      .where(inArray(activitySdgs.activity_id, activityIds));

    for (const row of sdgRows) {
      if (row.number == null || !row.name) continue;
      const list = sdgsByActivity.get(row.activity_id) ?? [];
      list.push({ number: row.number, name: row.name, justification: row.justification });
      sdgsByActivity.set(row.activity_id, list);
    }
  }

  // Same calculation as the program page and the Orgo dialog.
  const schedule = computeSchedule(
    programData.start_time,
    entries.map((entry) => ({ ...entry, activity_duration_minutes: entry.activity_duration }))
  );

  const mappedEntries: ProgramExportEntry[] = schedule.entries.map((entry) => ({
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
          instructions: entry.activity_instructions,
          approximate_duration_minutes: entry.activity_duration,
          group_sizes: categoriesByActivity.get(entry.activity_id)?.group_sizes ?? [],
          effort_level: entry.activity_effort_level,
          locations: categoriesByActivity.get(entry.activity_id)?.locations ?? [],
          format: formatFocusByActivity.get(entry.activity_id)?.format?.name ?? null,
          focus: formatFocusByActivity.get(entry.activity_id)?.focus?.name ?? null,
          secondaryFocus: formatFocusByActivity.get(entry.activity_id)?.secondary_focus?.name ?? null,
          educationalGoals: goalsByActivity.get(entry.activity_id) ?? [],
          sdgs: sdgsByActivity.get(entry.activity_id) ?? [],
          physicalRisk: {
            level: entry.activity_physical_risk_level,
            risk: entry.activity_physical_risk,
            mitigation: entry.activity_physical_mitigation,
          },
          psychologicalRisk: {
            level: entry.activity_psychological_risk_level,
            risk: entry.activity_psychological_risk,
            mitigation: entry.activity_psychological_mitigation,
          },
          objectives: objectivesByActivity.get(entry.activity_id) ?? [],
          challenges: challengesByActivity.get(entry.activity_id) ?? [],
          source: entry.activity_source_id ? sourcesById.get(entry.activity_source_id) ?? null : null,
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
