import { and, asc, eq, inArray, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { activities, activityFocuses, activityFormats } from '../../../drizzle/schema';

export type ValueRef = { id: string; code: string; name: string };

export type FormatFocus = {
  format: ValueRef | null;
  focus: ValueRef | null;
  secondary_focus: ValueRef | null;
};

type Row = { id: string; format_id: string | null; focus_id: string | null; secondary_focus_id: string | null };

/** The format, main focus and secondary focus of several activities (two small queries, whatever the count). */
export async function loadFormatFocus(rows: readonly Row[]): Promise<Map<string, FormatFocus>> {
  const formatIds = [...new Set(rows.flatMap((r) => (r.format_id ? [r.format_id] : [])))];
  const focusIds = [...new Set(rows.flatMap((r) => [r.focus_id, r.secondary_focus_id].filter((id): id is string => Boolean(id))))];
  const [formats, focuses] = await Promise.all([
    formatIds.length
      ? db.select({ id: activityFormats.id, code: activityFormats.code, name: activityFormats.name }).from(activityFormats).where(inArray(activityFormats.id, formatIds))
      : [],
    focusIds.length
      ? db.select({ id: activityFocuses.id, code: activityFocuses.code, name: activityFocuses.name }).from(activityFocuses).where(inArray(activityFocuses.id, focusIds))
      : [],
  ]);
  const formatById = new Map(formats.map((f) => [f.id, f]));
  const focusById = new Map(focuses.map((f) => [f.id, f]));
  return new Map(
    rows.map((row) => [
      row.id,
      {
        format: row.format_id ? formatById.get(row.format_id) ?? null : null,
        focus: row.focus_id ? focusById.get(row.focus_id) ?? null : null,
        secondary_focus: row.secondary_focus_id ? focusById.get(row.secondary_focus_id) ?? null : null,
      },
    ])
  );
}

/**
 * WHERE conditions for the format and focus filters. Several values of one filter match any of
 * them; a focus matches when it is the activity's main OR its secondary focus.
 */
export function formatFocusConditions(filters: { formatIds?: readonly string[]; focusIds?: readonly string[] }): SQL[] {
  const conditions: SQL[] = [];
  if (filters.formatIds?.length) conditions.push(inArray(activities.format_id, [...filters.formatIds]));
  if (filters.focusIds?.length) {
    conditions.push(or(inArray(activities.focus_id, [...filters.focusIds]), inArray(activities.secondary_focus_id, [...filters.focusIds]))!);
  }
  return conditions;
}

export type ValueWithCount = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  position: number;
  is_managed: boolean;
  /** Approved activities that use the value (as main or secondary focus for focuses). */
  activity_count: number;
};

/** The formats with the number of approved activities that have each one. */
export async function listFormatsWithCounts(): Promise<ValueWithCount[]> {
  const rows = await db
    .select({
      id: activityFormats.id,
      code: activityFormats.code,
      name: activityFormats.name,
      description: activityFormats.description,
      position: activityFormats.position,
      is_managed: activityFormats.is_managed,
      activity_count: sql<number>`count(${activities.id})::int`,
    })
    .from(activityFormats)
    .leftJoin(activities, and(eq(activities.format_id, activityFormats.id), eq(activities.is_approved, true)))
    .groupBy(activityFormats.id)
    .orderBy(asc(activityFormats.position), asc(activityFormats.name));
  return rows;
}

/** The focuses with the number of approved activities that have each one as main or secondary focus. */
export async function listFocusesWithCounts(): Promise<ValueWithCount[]> {
  const rows = await db
    .select({
      id: activityFocuses.id,
      code: activityFocuses.code,
      name: activityFocuses.name,
      description: activityFocuses.description,
      position: activityFocuses.position,
      is_managed: activityFocuses.is_managed,
      activity_count: sql<number>`count(${activities.id})::int`,
    })
    .from(activityFocuses)
    .leftJoin(
      activities,
      and(
        or(eq(activities.focus_id, activityFocuses.id), eq(activities.secondary_focus_id, activityFocuses.id)),
        eq(activities.is_approved, true)
      )
    )
    .groupBy(activityFocuses.id)
    .orderBy(asc(activityFocuses.position), asc(activityFocuses.name));
  return rows;
}
