import { eq, inArray, isNull, or } from 'drizzle-orm';
import type { ReferenceExecutor } from './progress-matrix';
import { activities, activityActivityTypes, activityFocuses, activityFormats, activityTypes } from '../../../drizzle/schema';

/**
 * How the former activity types map to the new fields (openspec: reference-sheet-alignment, D5).
 * The order is the precedence when an activity has several: the first mapped format and the
 * first two mapped focuses are used. "Serviço" has no equivalent and is only reported.
 */
export const TYPE_TO_FORMAT: readonly [typeName: string, formatCode: string][] = [
  ['Jogo', 'jogo'],
  ['Quebra-Gelo', 'quebra-gelo'],
  ['Reflexão', 'reflexao-debriefing'],
  ['Técnica', 'tecnica-oficina'],
  ['Desafio', 'desafio-iniciativa'],
  ['Aventura', 'aventura-percurso'],
];
export const TYPE_TO_FOCUS: readonly [typeName: string, focusCode: string][] = [
  ['Cooperação', 'cooperacao'],
  ['Liderança', 'lideranca'],
  ['Criatividade', 'criatividade'],
];

export interface FormatFocusBackfillResult {
  /** Activities that got a format, a main focus or a secondary focus from their former types. */
  updated: number;
  /** Activities that still lack a format or a main focus afterwards (an admin must complete them). */
  stillIncomplete: number;
  /** Former type names with no equivalent, with the number of activities that carry them. */
  unmappedTypes: Record<string, number>;
}

/**
 * Fills `format_id`, `focus_id` and `secondary_focus_id` from the former activity types for
 * activities that have none of them yet. Never overwrites a value, so it is safe to run on
 * every load. The old type links stay in place.
 */
export async function backfillFormatAndFocus(database: ReferenceExecutor): Promise<FormatFocusBackfillResult> {
  const formatIds = new Map((await database.select({ id: activityFormats.id, code: activityFormats.code }).from(activityFormats)).map((r) => [r.code, r.id]));
  const focusIds = new Map((await database.select({ id: activityFocuses.id, code: activityFocuses.code }).from(activityFocuses)).map((r) => [r.code, r.id]));

  const candidates = await database
    .select({ id: activities.id, format_id: activities.format_id, focus_id: activities.focus_id, secondary_focus_id: activities.secondary_focus_id })
    .from(activities)
    .where(or(isNull(activities.format_id), isNull(activities.focus_id)));
  const result: FormatFocusBackfillResult = { updated: 0, stillIncomplete: 0, unmappedTypes: {} };
  if (candidates.length === 0) return result;

  const links = await database
    .select({ activity_id: activityActivityTypes.activity_id, type_name: activityTypes.name })
    .from(activityActivityTypes)
    .innerJoin(activityTypes, eq(activityTypes.id, activityActivityTypes.activity_type_id))
    .where(inArray(activityActivityTypes.activity_id, candidates.map((c) => c.id)));
  const typesByActivity = new Map<string, Set<string>>();
  for (const link of links) {
    const set = typesByActivity.get(link.activity_id) ?? new Set<string>();
    set.add(link.type_name);
    typesByActivity.set(link.activity_id, set);
  }

  const mappedNames = new Set([...TYPE_TO_FORMAT, ...TYPE_TO_FOCUS].map(([name]) => name));
  for (const candidate of candidates) {
    const names = typesByActivity.get(candidate.id) ?? new Set<string>();
    for (const name of names) if (!mappedNames.has(name)) result.unmappedTypes[name] = (result.unmappedTypes[name] ?? 0) + 1;

    const format = candidate.format_id ?? TYPE_TO_FORMAT.filter(([name]) => names.has(name)).map(([, code]) => formatIds.get(code))[0] ?? null;
    const focuses = TYPE_TO_FOCUS.filter(([name]) => names.has(name)).map(([, code]) => focusIds.get(code)).filter((id): id is string => Boolean(id));
    const focus = candidate.focus_id ?? focuses[0] ?? null;
    const secondary = candidate.secondary_focus_id ?? focuses.find((id) => id !== focus) ?? null;

    const changed = format !== candidate.format_id || focus !== candidate.focus_id || secondary !== candidate.secondary_focus_id;
    if (changed) {
      await database.update(activities).set({ format_id: format, focus_id: focus, secondary_focus_id: secondary }).where(eq(activities.id, candidate.id));
      result.updated++;
    }
    if (!format || !focus) result.stillIncomplete++;
  }
  return result;
}
