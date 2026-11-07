import { sql } from 'drizzle-orm';
import type { ReferenceExecutor } from './progress-matrix';
import { activitySources } from '../../../drizzle/schema';
import dataset from '../../../drizzle/seeds/data/activity-sources.json';

export interface ActivitySourceRecord {
  code: string;
  name: string;
  url: string | null;
  license: string | null;
  access: string | null;
  language: string | null;
}

export const ACTIVITY_SOURCES = (dataset as { sources: ActivitySourceRecord[] }).sources;

/**
 * Loads the catalogue of activity sources. Idempotent: rows are upserted by `code`, only
 * changed rows are written, and only managed rows are updated. Returns the rows written.
 */
export async function applyActivitySources(
  database: ReferenceExecutor,
  sources: ActivitySourceRecord[] = ACTIVITY_SOURCES
): Promise<number> {
  let changed = 0;
  for (const source of sources) {
    const rows = await database
      .insert(activitySources)
      .values({ ...source, is_managed: true })
      .onConflictDoUpdate({
        target: activitySources.code,
        set: { name: source.name, url: source.url, license: source.license, access: source.access, language: source.language, is_managed: true },
        setWhere: sql`(${activitySources.name}, ${activitySources.url}, ${activitySources.license}, ${activitySources.access}, ${activitySources.language}, ${activitySources.is_managed}) IS DISTINCT FROM (${source.name}, ${source.url}, ${source.license}, ${source.access}, ${source.language}, true)`,
      })
      .returning({ id: activitySources.id });
    changed += rows.length;
  }
  return changed;
}
