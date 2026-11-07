/**
 * One-off: rewrites every program's entry positions and stored start/end times
 * from the shared schedule calculation (src/lib/programs/schedule.ts).
 * Safe to run more than once. Uses DATABASE_URL (locally: .env.local).
 *
 *   npx tsx scripts/recalculate-schedules.ts
 */
import { db, client } from '@/lib/db/server';
import { recalculateProgramSchedule } from '@/lib/programs/recalculate';
import { programs } from '../drizzle/schema';

async function main() {
  const all = await db.select({ id: programs.id, name: programs.name }).from(programs);
  let changed = 0;
  for (const program of all) {
    const result = await db.transaction((tx) => recalculateProgramSchedule(program.id, tx));
    if (result) changed += 1;
  }
  console.log(`Recalculated ${changed} of ${all.length} programs`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.end({ timeout: 5 }));
