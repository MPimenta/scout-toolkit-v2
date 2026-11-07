/**
 * Loads the Matriz Progresso Pessoal reference data (areas, paths, general and
 * specific objectives, challenge types, challenges and their links) into whatever
 * database DATABASE_URL points at. Idempotent: safe to run on every deploy.
 *
 * Usage: npm run db:load-reference
 */
import { client, db } from '@/lib/db/server';
import { applyProgressMatrix } from '@/lib/reference-data/progress-matrix';
import { applyActivitySources } from '@/lib/reference-data/activity-sources';

async function main() {
  const result = await applyProgressMatrix(db);
  const changed = Object.values(result.changed).reduce((sum, n) => sum + n, 0);
  console.log(
    changed === 0 && result.retired.goals === 0
      ? 'Reference data (Matriz) already up to date'
      : `Reference data (Matriz) loaded: ${JSON.stringify(result.changed)}`
  );
  const sourcesChanged = await applyActivitySources(db);
  console.log(sourcesChanged === 0 ? 'Activity sources already up to date' : `Activity sources loaded: ${sourcesChanged}`);
  if (result.retired.goals > 0 || result.retired.areas > 0) {
    console.log(
      `Retired ${result.retired.goals} placeholder goals and ${result.retired.areas} placeholder areas ` +
        `(${result.retired.activityLinks} activity-goal links removed)`
    );
  }
  const stale = Object.values(result.removedStale).reduce((sum, n) => sum + n, 0);
  if (stale > 0) console.log(`Removed stale managed rows: ${JSON.stringify(result.removedStale)}`);
}

main()
  .catch((error) => {
    console.error('Reference data load failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end({ timeout: 5 });
  });
