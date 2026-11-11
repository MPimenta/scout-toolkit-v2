/**
 * LOCAL ONLY. Re-links the activities of a local development database to Matriz
 * objectives (age-matched) and makes the first few activities multi-valued
 * (two group sizes, two age groups, several objectives) so the UI is exercised.
 *
 * Refuses any DATABASE_URL whose host is not localhost. Idempotent: running it again
 * produces the same links. Run `npm run db:load-reference` first.
 *
 * Usage: npx tsx scripts/relink-local-activities.ts [--multi 6]
 */
import { asc, eq } from 'drizzle-orm';
import { client, db } from '@/lib/db/server';
import {
  activities,
  activityAgeGroups,
  activityEducationalGoals,
  activityGroupSizes,
  educationalGoalAgeGroups,
  educationalGoals,
} from '../drizzle/schema';
import { AGE_GROUP_VALUES, GROUP_SIZE_VALUES, type AgeGroupValue } from '../drizzle/schema/category-values';

function assertLocal() {
  const url = process.env['DATABASE_URL'] ?? '';
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    // fall through to the refusal below
  }
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) {
    console.error(`Refusing to run: DATABASE_URL host "${host || 'unknown'}" is not local.`);
    process.exit(1);
  }
}

/** Neighbouring division used to give an activity a second age group. */
const NEXT_AGE_GROUP: Record<string, AgeGroupValue | undefined> = {
  cub_scouts: 'scouts',
  scouts: 'adventurers',
  adventurers: 'rovers',
  rovers: 'adventurers',
};

async function main() {
  assertLocal();
  const multiArg = process.argv.indexOf('--multi');
  const multiCount = multiArg >= 0 ? Number(process.argv[multiArg + 1]) : 6;

  const rows = await db.select().from(activities).orderBy(asc(activities.name));
  if (rows.length === 0) {
    console.log('No activities to re-link.');
    return;
  }

  const goalRows = await db
    .select({ id: educationalGoals.id, code: educationalGoals.code, age_group: educationalGoalAgeGroups.age_group })
    .from(educationalGoals)
    .innerJoin(educationalGoalAgeGroups, eq(educationalGoalAgeGroups.goal_id, educationalGoals.id))
    .orderBy(asc(educationalGoals.position));
  if (goalRows.length === 0) {
    console.error('No Matriz objectives found. Run `npm run db:load-reference` first.');
    process.exit(1);
  }
  const goalsByAge = new Map<string, Array<{ id: string; code: string }>>();
  for (const row of goalRows) {
    const list = goalsByAge.get(row.age_group) ?? [];
    if (!list.some((g) => g.id === row.id)) list.push({ id: row.id, code: row.code });
    goalsByAge.set(row.age_group, list);
  }

  let index = 0;
  let multiDone = 0;
  for (const activity of rows) {
    const ageRows = await db.select().from(activityAgeGroups).where(eq(activityAgeGroups.activity_id, activity.id));
    let ages = ageRows.map((row) => row.age_group as AgeGroupValue).filter((age) => AGE_GROUP_VALUES.includes(age));
    const sizeRows = await db.select().from(activityGroupSizes).where(eq(activityGroupSizes.activity_id, activity.id));
    let sizes = sizeRows.map((row) => row.group_size);
    // Leftover e2e/test activities are re-linked but not made multi-valued.
    const isTest = /^(E2E|Proposta E2E)/.test(activity.name);
    const makeMulti = !isTest && multiDone < multiCount;
    if (makeMulti) multiDone++;
    index++;

    if (makeMulti) {
      if (ages.length < 2) {
        const extra = NEXT_AGE_GROUP[ages[0] ?? 'scouts'];
        if (extra && !ages.includes(extra)) ages = [...ages, extra];
      }
      if (sizes.length < 2) {
        const extra = GROUP_SIZE_VALUES.find((value) => !sizes.includes(value));
        if (extra) sizes = [...sizes, extra];
      }
      await db.delete(activityAgeGroups).where(eq(activityAgeGroups.activity_id, activity.id));
      await db.insert(activityAgeGroups).values(ages.map((age_group) => ({ activity_id: activity.id, age_group })));
      await db.delete(activityGroupSizes).where(eq(activityGroupSizes.activity_id, activity.id));
      await db.insert(activityGroupSizes).values(sizes.map((group_size) => ({ activity_id: activity.id, group_size })));
    }

    // Two to four objectives, spread over the activity's age groups, deterministic by position.
    const wanted = makeMulti ? 4 : 2;
    const chosen = new Map<string, string>();
    for (let round = 0; chosen.size < wanted && round < wanted; round++) {
      for (const age of ages) {
        const pool = goalsByAge.get(age) ?? [];
        if (pool.length === 0) continue;
        const goal = pool[(index * 7 + round * 11 + AGE_GROUP_VALUES.indexOf(age)) % pool.length]!;
        chosen.set(goal.id, goal.code);
        if (chosen.size >= wanted) break;
      }
    }

    await db.delete(activityEducationalGoals).where(eq(activityEducationalGoals.activity_id, activity.id));
    const rowsToInsert = [...chosen.keys()].flatMap((goal_id) =>
      ages
        .filter((age) => (goalsByAge.get(age) ?? []).some((goal) => goal.id === goal_id))
        .map((age_group) => ({ activity_id: activity.id, goal_id, age_group }))
    );
    if (rowsToInsert.length > 0) {
      await db.insert(activityEducationalGoals).values(rowsToInsert);
    }
    console.log(
      `${activity.name}: ${ages.join('+')} | ${sizes.join('+')} | ${[...chosen.values()].join(', ') || '(no objectives)'}`
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end({ timeout: 5 });
  });
