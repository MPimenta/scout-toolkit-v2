import { eq, and, ne } from 'drizzle-orm';
import type { ReferenceExecutor } from './progress-matrix';
import { sdgs } from '../../../drizzle/schema';

/** Each of the 17 ODS uses its own icon: `/sdg-icons/sdg-<number>.png`. */
export function sdgIconUrl(number: number): string {
  return `/sdg-icons/sdg-${number}.png`;
}

/**
 * Sets the icon of every ODS to its own image. `seedSDGs` never updates an existing row, so a
 * database seeded before ODS 11 was fixed still points it at the ODS 9 image. Idempotent.
 * Returns the number of rows corrected.
 */
export async function applySdgIcons(database: ReferenceExecutor): Promise<number> {
  let changed = 0;
  for (let number = 1; number <= 17; number++) {
    const rows = await database
      .update(sdgs)
      .set({ icon_url: sdgIconUrl(number) })
      .where(and(eq(sdgs.number, number), ne(sdgs.icon_url, sdgIconUrl(number))))
      .returning({ id: sdgs.id });
    changed += rows.length;
  }
  return changed;
}
