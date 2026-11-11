import { sql } from 'drizzle-orm';
import type { ReferenceExecutor } from './progress-matrix';
import { activityFocuses, activityFormats } from '../../../drizzle/schema';
import formatsDataset from '../../../drizzle/seeds/data/activity-formats.json';
import focusesDataset from '../../../drizzle/seeds/data/activity-focuses.json';

export interface ValueRecord {
  code: string;
  name: string;
  description: string;
  position: number;
}

export const ACTIVITY_FORMATS = (formatsDataset as { formats: ValueRecord[] }).formats;
export const ACTIVITY_FOCUSES = (focusesDataset as { focuses: ValueRecord[] }).focuses;

/**
 * Loads the official formats and focuses (reference sheet tabs "formatos" and "focos").
 * Idempotent: rows are upserted by `code`, only changed rows are written, and every loaded
 * row is managed (admins cannot rename or delete it; they can add their own values).
 * Returns the number of rows written.
 */
export async function applyActivityFormatsAndFocuses(
  database: ReferenceExecutor,
  data: { formats: ValueRecord[]; focuses: ValueRecord[] } = { formats: ACTIVITY_FORMATS, focuses: ACTIVITY_FOCUSES }
): Promise<{ formats: number; focuses: number }> {
  let formats = 0;
  for (const row of data.formats) {
    const written = await database
      .insert(activityFormats)
      .values({ ...row, is_managed: true })
      .onConflictDoUpdate({
        target: activityFormats.code,
        set: { name: row.name, description: row.description, position: row.position, is_managed: true },
        setWhere: sql`(${activityFormats.name}, ${activityFormats.description}, ${activityFormats.position}, ${activityFormats.is_managed}) IS DISTINCT FROM (${row.name}, ${row.description}, ${row.position}::int, true)`,
      })
      .returning({ id: activityFormats.id });
    formats += written.length;
  }
  let focuses = 0;
  for (const row of data.focuses) {
    const written = await database
      .insert(activityFocuses)
      .values({ ...row, is_managed: true })
      .onConflictDoUpdate({
        target: activityFocuses.code,
        set: { name: row.name, description: row.description, position: row.position, is_managed: true },
        setWhere: sql`(${activityFocuses.name}, ${activityFocuses.description}, ${activityFocuses.position}, ${activityFocuses.is_managed}) IS DISTINCT FROM (${row.name}, ${row.description}, ${row.position}::int, true)`,
      })
      .returning({ id: activityFocuses.id });
    focuses += written.length;
  }
  return { formats, focuses };
}
